import {app, BrowserWindow, ipcMain, IpcMainEvent} from 'electron';
import path from 'node:path';
import {promises as fs} from 'node:fs';
import started from 'electron-squirrel-startup';
import {from, Subject} from 'rxjs';
import {mergeMap, tap, retry, delay, catchError, takeUntil} from 'rxjs/operators';

import {TalonSheetSchema, TalonSchema} from '@/shared/TalonSchema';
import {downloadProgressInfo} from '@/shared/Download';

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
        mainWindow.webContents.openDevTools();
    }

    ipcMain.on('download-talons', downloadTalons);

    const TOKEN = secrets.REDMINE_TOKEN || '';
    async function downloadTalons(event: IpcMainEvent, talons: TalonSheetSchema, xlsxFileName: string) {
        mainWindow.webContents.send('download-talons-start');
        let completed = 0;
        const abortSignal = new Subject<void>();
        function handleAbort() {
            console.error('Aborting download');
            abortSignal.next();
            abortSignal.complete();
            ipcMain.removeListener('abort-download-talons', handleAbort);
        }
        from(talons)
            .pipe(
                mergeMap(
                    (talon) =>
                        from(downloadTalon(talon, xlsxFileName)).pipe(
                            catchError((error) => {
                                console.error(error);
                                throw error;
                            }),
                            retry(3),
                            delay(1000),
                            tap((talon) => {
                                mainWindow.webContents.send(
                                    'download-talons-progress',
                                    downloadProgressInfo(completed, talons.length, talon),
                                );
                                completed++;
                            }),
                        ),
                    8,
                ),
                delay(500),
                takeUntil(abortSignal),
            )
            .subscribe({
                error(error) {
                    console.error(error);
                    mainWindow.webContents.send('download-talons-error', error);
                },
                complete() {
                    mainWindow.webContents.send('download-talons-complete');
                    ipcMain.removeListener('abort-download-talons', handleAbort);
                },
            });
        ipcMain.addListener('abort-download-talons', handleAbort);
    }

    async function downloadTalon(talon: TalonSchema, xlsxFileName: string) {
        const talonId = talon['#'];
        const response = await fetch(`https://grunt.rm.mosreg.ru/issues/${talonId}.pdf`, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'X-Redmine-API-Key': TOKEN,
            },
        });
        if (!response.ok) {
            const error = await response.text();
            console.error(error);
            throw new Error(error);
        }
        const blob = await response.blob();
        const blobArray = await blob.arrayBuffer();
        const folderName = `folder_${xlsxFileName}`;
        await fs.mkdir(path.resolve(app.getPath('downloads'), folderName), {recursive: true});
        const filePath = path.join(
            app.getPath('downloads'),
            folderName,
            `elektronnye_talony_na_vyvoz_ossig-${talonId}.pdf`,
        );
        await fs.writeFile(filePath, Buffer.from(blobArray));
        return talon;
    }
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
