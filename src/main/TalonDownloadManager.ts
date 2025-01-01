import {promises as fs} from 'node:fs';
import path from 'node:path';

import {from, Subject, of, Observable, EMPTY} from 'rxjs';
import {mergeMap, tap, retry, delay, catchError, map, withLatestFrom} from 'rxjs/operators';

import {normalizeError} from '@/lib/normalizeError';
import {DownloadCache} from '@/main/DownloadCache';
import {TalonDownloadProgressInfo, downloadProgressInfo} from '@/shared/Download';
import {downloadTalonsError, downloadTalonsProgress} from '@/shared/events';
import {RedmineApi} from '@/main/RedmineApi';
import {makeFileName, makeFolderName, getTalonIdFromFileName, testTalonFileFormat} from '@/main/outputFile';

type DownloadEvent =
    | {
          event: typeof downloadTalonsProgress;
          downloadInfo: TalonDownloadProgressInfo;
      }
    | {
          event: typeof downloadTalonsError;
          downloadInfo: TalonDownloadProgressInfo;
          error: string;
      };

export class TalonDownloadManager {
    private cache: Map<string, DownloadCache> = new Map();
    private redmineApi: RedmineApi;
    constructor(
        token: string,
        reserveToken: string,
        private dowloadPath: string,
    ) {
        this.redmineApi = new RedmineApi(token, reserveToken);
    }

    public isDownloadFinished(xlsxFileName: string) {
        const progress = this.cache.get(xlsxFileName)?.getProgress();
        if (progress === undefined) {
            return false;
        }
        return progress.completed === progress.total;
    }

    private async restoreCache(xlsxFileName: string, talonIds: string[]) {
        const cache = new DownloadCache(xlsxFileName, talonIds);
        try {
            const folderName = `folder_${xlsxFileName}`;
            const folderPath = path.resolve(this.dowloadPath, folderName);
            const files = await fs.readdir(folderPath);
            for (const file of files) {
                const isTalonFile = testTalonFileFormat(file);
                if (!isTalonFile) {
                    continue;
                }
                const talonId = getTalonIdFromFileName(file);
                cache.complete(talonId);
            }
        } catch (error) {
            console.error(error);
        }
        this.cache.set(xlsxFileName, cache);
        return cache;
    }

    public async getDownloadCacheInfoFs(xlsxFileName: string, talonIds: string[]) {
        const cache = await this.restoreCache(xlsxFileName, talonIds);
        return cache.getProgress();
    }

    public getDownloadCacheInfo(xlsxFileName: string) {
        const cache = this.cache.get(xlsxFileName);
        if (!cache) {
            throw new Error('Cache not found');
        }

        return cache.getProgress();
    }

    public downloadTalons(talons: string[], xlsxFileName: string, abortSignal: Subject<void>) {
        const concurrency = 8;
        let shouldAbort = false;
        abortSignal.subscribe(() => {
            shouldAbort = true;
        });
        const createTalonDownloadStream = (talon: string, cache: DownloadCache): Observable<DownloadEvent> => {
            return from(this.downloadTalon(talon, xlsxFileName)).pipe(
                retry(3),
                tap((talonId) => cache.complete(talonId)),
                map((talonId) => {
                    const progress = cache.getProgress();
                    return {
                        event: downloadTalonsProgress,
                        downloadInfo: downloadProgressInfo(progress.completed, progress.failed, progress.total, {
                            talonId,
                        }),
                    } as DownloadEvent;
                }),
                catchError((error) => {
                    // count error, dispatch error and then
                    // continue downloading
                    const errorMessage = normalizeError(error).message;
                    cache.fail(talon, errorMessage);
                    const progress = cache.getProgress();
                    return of({
                        event: downloadTalonsError,
                        downloadInfo: downloadProgressInfo(progress.completed, progress.failed, progress.total, {
                            talonId: talon,
                        }),
                        error: errorMessage,
                    } as DownloadEvent);
                }),
                delay(1000),
            );
        };

        return from(this.restoreCache(xlsxFileName, talons)).pipe(
            mergeMap((cache) => from(cache.getUncompletedTalons()).pipe(withLatestFrom(of(cache)))),
            mergeMap(([talon, cache]) => (shouldAbort ? EMPTY : createTalonDownloadStream(talon, cache)), concurrency),
        );
    }

    private async downloadTalon(talonId: string, xlsxFileName: string) {
        const blobArray = await this.redmineApi.getTalon(talonId);
        const folderName = makeFolderName(xlsxFileName);
        await fs.mkdir(path.resolve(this.dowloadPath, folderName), {recursive: true});
        const fileName = makeFileName(talonId);
        const filePath = path.join(this.dowloadPath, folderName, fileName);
        await fs.writeFile(filePath, Buffer.from(blobArray));
        return talonId;
    }
}
