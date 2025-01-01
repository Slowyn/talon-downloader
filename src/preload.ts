// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from 'electron';

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

declare global {
    interface Window {
        electronAPI: {
            downloadTalons: (talons: TalonSheetSchema, xlsxFileName: string) => void;
            abortDownloadTalons: () => void;
            onDownloadAllTalonsStart: (callback: () => void) => void;
            onDownloadTalonStart: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) => void;
            onDownloadTalonProgress: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) => void;
            onDownloadTalonError: (callback: (downloadInfo: TalonDownloadProgressInfo, error: string) => void) => void;
            onDownloadTalonsComplete: (callback: () => void) => void;
            getDetailedDownloadInfo: (xlsxFileName: string) => Promise<DetailedDownloadInfo>;
            getDetailedDownloadInfoFs: (
                xlsxFileName: string,
                talons: TalonSheetSchema,
            ) => Promise<DetailedDownloadInfo>;
        };
    }
}

contextBridge.exposeInMainWorld('electronAPI', {
    downloadTalons: (talons: TalonSheetSchema, xlsxFileName: string) =>
        ipcRenderer.send(downloadTalons, talons, xlsxFileName),
    abortDownloadTalons: () => ipcRenderer.send(abortDownloadTalons),
    onDownloadAllTalonsStart: (callback: () => void) => ipcRenderer.on(downloadAllTalonsStart, callback),
    onDownloadTalonStart: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) =>
        ipcRenderer.on(downloadTalonStart, (event, downloadInfo) => {
            callback(downloadInfo);
        }),
    onDownloadTalonProgress: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) =>
        ipcRenderer.on(downloadTalonsProgress, (event, downloadInfo) => {
            callback(downloadInfo);
        }),
    onDownloadTalonError: (callback: (downloadInfo: TalonDownloadProgressInfo, error: Error) => void) =>
        ipcRenderer.on(downloadTalonsError, (event, downloadInfo, error) => {
            callback(downloadInfo, error);
        }),
    onDownloadTalonsComplete: (callback: () => void) =>
        ipcRenderer.on(downloadTalonsComplete, (event) => {
            callback();
        }),

    getDetailedDownloadInfo: (xlsxFileName: string): Promise<DetailedDownloadInfo> => {
        return ipcRenderer.invoke(getDetailedDownloadInfo, xlsxFileName);
    },
    getDetailedDownloadInfoFs: (xlsxFileName: string, talons: TalonSheetSchema): Promise<DetailedDownloadInfo> => {
        return ipcRenderer.invoke(getDetailedDownloadInfoFs, xlsxFileName, talons);
    },
});
