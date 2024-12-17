// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from 'electron';

import {TalonSheetSchema} from '@/shared/TalonSchema';
import {TalonDownloadProgressInfo} from '@/shared/Download';
import {
    downloadTalons,
    abortDownloadTalons,
    downloadTalonsStart,
    downloadTalonsComplete,
    downloadTalonsProgress,
    downloadTalonsError,
} from '@/shared/events';

contextBridge.exposeInMainWorld('electronAPI', {
    downloadTalons: (talons: TalonSheetSchema, xlsxFileName: string) =>
        ipcRenderer.send(downloadTalons, talons, xlsxFileName),
    abortDownloadTalons: () => ipcRenderer.send(abortDownloadTalons),
    onDownloadTalonsStart: (callback: () => void) => ipcRenderer.on(downloadTalonsStart, callback),
    onDownloadTalonProgress: (callback: (downloadInfo: TalonDownloadProgressInfo) => void) =>
        ipcRenderer.on(downloadTalonsProgress, (event, downloadInfo) => {
            callback(downloadInfo);
        }),
    onDownloadTalonError: (callback: (error: Error) => void) =>
        ipcRenderer.on(downloadTalonsError, (event, error) => {
            callback(error);
        }),
    onDownloadTalonComplete: (callback: () => void) =>
        ipcRenderer.on(downloadTalonsComplete, (event) => {
            callback();
        }),
});
