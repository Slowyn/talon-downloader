import {promises as fs} from 'node:fs';
import path from 'node:path';

import {from, Subject, of} from 'rxjs';
import {mergeMap, tap, retry, delay, catchError, takeUntil} from 'rxjs/operators';

import {DownloadCache} from '@/main/DownloadCache';
import {TalonDownloadProgressInfo, downloadProgressInfo} from '@/shared/Download';
import {
    downloadTalonsStart,
    downloadTalonsError,
    downloadTalonsProgress,
    downloadTalonsComplete,
} from '@/shared/events';
import {RedmineApi} from '@/main/RedmineApi';
import {makeFileName, makeFolderName, getTalonIdFromFileName, testTalonFileFormat} from '@/main/outputFile';

type DownloadEvent =
    | {
          event: typeof downloadTalonsStart;
      }
    | {
          event: typeof downloadTalonsProgress;
          downloadInfo: TalonDownloadProgressInfo;
      }
    | {
          event: typeof downloadTalonsError;
          error: string;
      }
    | {
          event: typeof downloadTalonsComplete;
      }
    | {
          event: typeof downloadTalonsComplete;
      };

export class TalonDownloadManager {
    private cache: Map<string, DownloadCache> = new Map();
    private redmineApi: RedmineApi;
    constructor(
        token: string,
        private dowloadPath: string,
    ) {
        this.redmineApi = new RedmineApi(token);
    }

    async restoreCache(xlsxFileName: string, talonIds: string[]) {
        try {
            const folderName = `folder_${xlsxFileName}`;
            const folderPath = path.resolve(this.dowloadPath, folderName);
            const files = await fs.readdir(folderPath);
            const cache = new DownloadCache(xlsxFileName, talonIds);
            for (const file of files) {
                const isTalonFile = testTalonFileFormat(file);
                if (!isTalonFile) {
                    continue;
                }
                const talonId = getTalonIdFromFileName(file);
                cache.complete(talonId);
            }
            this.cache.set(xlsxFileName, cache);
        } catch (error) {
            console.error(error);
            this.cache.set(xlsxFileName, new DownloadCache(xlsxFileName, talonIds));
        }
        const cache = this.cache.get(xlsxFileName);
        return cache;
    }

    public async downloadTalons(talons: string[], xlsxFileName: string, abortSignal: Subject<void>) {
        const cache = await this.restoreCache(xlsxFileName, talons);
        if (!cache) {
            throw new Error('Failed to construct cache');
        }
        const downloadEventsStream = new Subject<DownloadEvent>();
        downloadEventsStream.next({event: downloadTalonsStart});
        const handleProgress = (talonId: string) => {
            cache.complete(talonId);
            const progress = cache.getProgress();
            downloadEventsStream.next({
                event: downloadTalonsProgress,
                downloadInfo: downloadProgressInfo(progress.completed, progress.failed, progress.total, {talonId}),
            });
        };
        const uncompletedTalons = cache.getUncompletedTalons();
        from(uncompletedTalons)
            .pipe(
                mergeMap(
                    (talon) =>
                        from(this.downloadTalon(talon, xlsxFileName)).pipe(
                            catchError((error) => {
                                // Just log the error
                                console.error(error);
                                throw error;
                            }),
                            retry(3),
                            delay(1000),
                            tap(handleProgress),
                            catchError((error) => {
                                // count error, dispatch error and then
                                // continue downloading
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                cache.fail(talon, errorMessage);
                                downloadEventsStream.next({event: downloadTalonsError, error: errorMessage});
                                return of(undefined);
                            }),
                        ),
                    8,
                ),
                takeUntil(abortSignal),
            )
            .subscribe({
                error: (error) => {
                    console.error(error);
                },
                complete: () => {
                    downloadEventsStream.next({event: downloadTalonsComplete});
                    downloadEventsStream.complete();
                },
            });
        return downloadEventsStream.asObservable();
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
