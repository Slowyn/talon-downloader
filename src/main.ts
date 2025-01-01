import {app, BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent} from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import {Subject} from 'rxjs';

import {TalonDownloadManager} from '@/main/TalonDownloadManager';
import {TalonSheetSchema} from '@/shared/TalonSchema';
import {
    abortDownloadTalons,
    downloadTalonsComplete,
    downloadTalonsError,
    downloadTalonsProgress,
    downloadAllTalonsStart,
    downloadTalonStart,
    getDetailedDownloadInfo,
    getDetailedDownloadInfoFs,
} from '@/shared/events';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
    app.quit();
}

const createWindow = async () => {
    const secrets = await import('@/secrets.json');
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // and load the index.html of the app.
    if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
    }

    // Open the DevTools.
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools({mode: 'detach'});
    }

    const TOKEN = secrets.REDMINE_TOKEN || '';
    const RESERVE_TOKEN = secrets.RESERVE_REMDINE_TOKEN || '';
    const talonDownloadManager = new TalonDownloadManager(TOKEN, RESERVE_TOKEN, app.getPath('downloads'));
    ipcMain.handle(getDetailedDownloadInfo, async (event: IpcMainInvokeEvent, xlsxFileName: string) => {
        return talonDownloadManager.getDownloadCacheInfo(xlsxFileName);
    });
    ipcMain.handle(
        getDetailedDownloadInfoFs,
        async (event: IpcMainInvokeEvent, xlsxFileName: string, talons: TalonSheetSchema) => {
            return talonDownloadManager.getDownloadCacheInfoFs(
                xlsxFileName,
                talons.map((talon) => talon['#'].toString()),
            );
        },
    );
    ipcMain.on('download-talons', async (event: IpcMainEvent, talons: TalonSheetSchema, xlsxFileName: string) => {
        const talonIds = talons.map((talon) => talon['#'].toString());
        const abortSignal = new Subject<void>();
        const handleAbort = () => {
            abortSignal.next();
            abortSignal.complete();
            ipcMain.removeListener(abortDownloadTalons, handleAbort);
        };
        const downloadStream = talonDownloadManager.downloadTalons(talonIds, xlsxFileName, abortSignal);
        ipcMain.once(abortDownloadTalons, handleAbort);
        mainWindow.webContents.send(downloadAllTalonsStart);
        downloadStream.subscribe({
            next: (event) => {
                if (event.event === downloadTalonsProgress || event.event === downloadTalonStart) {
                    mainWindow.webContents.send(event.event, event.downloadInfo);
                } else if (event.event === downloadTalonsError) {
                    mainWindow.webContents.send(event.event, event.downloadInfo, event.error);
                }
            },
            complete: () => {
                if (talonDownloadManager.isDownloadFinished(xlsxFileName)) {
                    mainWindow.webContents.send(downloadTalonsComplete);
                }
                ipcMain.removeListener(abortDownloadTalons, handleAbort);
            },
        });
    });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
