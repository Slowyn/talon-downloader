// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import {contextBridge, ipcRenderer} from 'electron';

import {TalonSheetSchema} from '@/shared/TalonSchema';

contextBridge.exposeInMainWorld('electronAPI', {
    downloadTalons: (talons: TalonSheetSchema) => ipcRenderer.send('download-talons', talons),
});
