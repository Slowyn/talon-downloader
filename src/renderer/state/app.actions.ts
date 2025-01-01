import type {StoreGetState, StoreSetState} from '@/renderer/state/app.state';
import {talonSheetSchema} from '@/shared/TalonSchema';
import {DownloadStatus, TalonDownloadProgressInfo} from '@/shared/Download';
import {readSheets} from '../lib/readSheets';

export function createAppActions(get: StoreGetState, set: StoreSetState) {
    return {
        setXlsxFile: async (xlsxFile: File) => {
            const xlsxFileName = xlsxFile.name;
            const data = await readSheets(xlsxFile);

            const parseResult = talonSheetSchema.safeParse(data);
            if (parseResult.error) {
                return;
            }
            const talons = parseResult.data;
            const downloadInfo = await window.electronAPI.getDetailedDownloadInfoFs(xlsxFileName, talons);
            return set((state) => {
                state.selectedXlsxFile = xlsxFileName;
                state.loadedXlsxFiles = new Set(get().loadedXlsxFiles).add(xlsxFileName);
                state.xlsx[xlsxFileName] = {
                    talons,
                    status: 'NotStarted',
                };
                state.downloadState[xlsxFileName] = downloadInfo;
            });
        },
        setSelectedXlsxFile: (xlsxFileName: string) => {
            return set((state) => {
                state.selectedXlsxFile = xlsxFileName;
            });
        },
        startDownloadingTalons: async () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            window.electronAPI.downloadTalons(get().xlsx[selectedXlsxFile].talons, selectedXlsxFile);
            return set((state) => {
                state.xlsx[selectedXlsxFile].status = 'InProgress';
            });
        },
        stopDownloadingTalons: async () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            window.electronAPI.abortDownloadTalons();
            return set((state) => {
                state.xlsx[selectedXlsxFile].status = 'Stopped';
            });
        },
        resumeDownloadingTalons: async () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            window.electronAPI.downloadTalons(get().xlsx[selectedXlsxFile].talons, selectedXlsxFile);
            return set((state) => {
                state.xlsx[selectedXlsxFile].status = 'InProgress';
            });
        },
        completeDownloadingTalons: () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            return set((state) => {
                state.xlsx[selectedXlsxFile].status = 'Completed';
            });
        },
        updateDownloadStatus: (downloadInfo: TalonDownloadProgressInfo, status: DownloadStatus) => {
            set((state) => {
                const {talonId} = downloadInfo.item;
                const selectedXlsxFile = state.selectedXlsxFile;
                if (!selectedXlsxFile) {
                    return;
                }
                const downloadState = state.downloadState[selectedXlsxFile];
                downloadState.statuses[talonId] = status;
                downloadState.total = downloadInfo.total;
                downloadState.completed = downloadInfo.completed;
                downloadState.failed = downloadInfo.failed;
            });
        },
    };
}
