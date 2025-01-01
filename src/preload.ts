// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer, IpcRendererEvent} from 'electron';

import {TalonSheetSchema} from '@/shared/TalonSchema';
import {TalonDownloadProgressInfo, DetailedDownloadInfo} from '@/shared/Download';
import {
    downloadTalons,
    abortDownloadTalons,
    downloadAllTalonsStart,
    downloadTalonStart,
    downloadTalonsComplete,
    downloadTalonsProgress,
    downloadTalonsError,
    getDetailedDownloadInfo,
    getDetailedDownloadInfoFs,
} from '@/shared/events';

type UnsubscribeFn = () => void;
declare global {
    interface Window {
        electronAPI: {
            downloadTalons: (talons: TalonSheetSchema, xlsxFileName: string) => void;
            abortDownloadTalons: () => void;
            onDownloadAllTalonsStart: (callback: () => void) => UnsubscribeFn;
            onDownloadTalonStart: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) => UnsubscribeFn;
            onDownloadTalonProgress: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) => UnsubscribeFn;
            onDownloadTalonError: (
                callback: (downloadInfo: TalonDownloadProgressInfo, error: string) => void,
            ) => UnsubscribeFn;
            onDownloadTalonsComplete: (callback: () => void) => UnsubscribeFn;
            getDetailedDownloadInfo: (xlsxFileName: string) => Promise<DetailedDownloadInfo>;
            getDetailedDownloadInfoFs: (
                xlsxFileName: string,
                talons: TalonSheetSchema,
            ) => Promise<DetailedDownloadInfo>;
        };
    }
}

function createIpcRenderedSubscription<E extends string, T extends (event: IpcRendererEvent, ...args: any[]) => void>(
    event: E,
    listener: T,
) {
    ipcRenderer.on(event, listener);
    return () => {
        ipcRenderer.off(event, listener);
    };
}

contextBridge.exposeInMainWorld('electronAPI', {
    downloadTalons: (talons: TalonSheetSchema, xlsxFileName: string) => {
        return ipcRenderer.send(downloadTalons, talons, xlsxFileName);
    },
    abortDownloadTalons: () => {
        return ipcRenderer.send(abortDownloadTalons);
    },
    onDownloadAllTalonsStart: (callback: () => void) => {
        return createIpcRenderedSubscription(downloadAllTalonsStart, callback);
    },
    onDownloadTalonStart: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) => {
        return createIpcRenderedSubscription(downloadTalonStart, (event, downloadInfo) => {
            callback(downloadInfo);
        });
    },
    onDownloadTalonProgress: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) => {
        return createIpcRenderedSubscription(downloadTalonsProgress, (event, downloadInfo) => {
            callback(downloadInfo);
        });
    },
    onDownloadTalonError: (callback: (downloadInfo: TalonDownloadProgressInfo, error: Error) => void) => {
        return createIpcRenderedSubscription(downloadTalonsError, (event, downloadInfo, error) => {
            callback(downloadInfo, error);
        });
    },
    onDownloadTalonsComplete: (callback: () => void) => {
        return createIpcRenderedSubscription(downloadTalonsComplete, (event) => {
            callback();
        });
    },

    getDetailedDownloadInfo: (xlsxFileName: string): Promise<DetailedDownloadInfo> => {
        return ipcRenderer.invoke(getDetailedDownloadInfo, xlsxFileName);
    },
    getDetailedDownloadInfoFs: (xlsxFileName: string, talons: TalonSheetSchema): Promise<DetailedDownloadInfo> => {
        return ipcRenderer.invoke(getDetailedDownloadInfoFs, xlsxFileName, talons);
    },
});
