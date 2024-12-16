// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from 'electron';

import {TalonSheetSchema, TalonSchema} from '@/shared/TalonSchema';
import {DownloadProgressInfo} from '@/shared/Download';

contextBridge.exposeInMainWorld('electronAPI', {
    downloadTalons: (talons: TalonSheetSchema, xlsxFileName: string) =>
        ipcRenderer.send('download-talons', talons, xlsxFileName),
    abortDownloadTalons: () => ipcRenderer.send('abort-download-talons'),
    onDownloadTalonsStart: (callback: () => void) => ipcRenderer.on('download-talons-start', callback),
    onDownloadTalonProgress: (callback: (downloadInfo: DownloadProgressInfo<TalonSchema>) => void) =>
        ipcRenderer.on('download-talons-progress', (event, downloadInfo) => {
            callback(downloadInfo);
        }),
    onDownloadTalonError: (callback: (error: Error) => void) =>
        ipcRenderer.on('download-talons-error', (event, error) => {
            callback(error);
        }),
    onDownloadTalonComplete: (callback: () => void) =>
        ipcRenderer.on('download-talons-complete', (event) => {
            callback();
        }),
});
