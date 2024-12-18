import {StoreApi} from 'zustand';
import {AppState} from '@/renderer/state/app.state';
import {talonSheetSchema} from '@/shared/TalonSchema';
import {DownloadStatus} from '@/shared/Download';
import {readSheets} from '../lib/readSheets';

type AppStore = StoreApi<AppState>;

export function createAppActions(get: AppStore['getState'], set: AppStore['setState']) {
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
            return set({
                selectedXlsxFile: xlsxFileName,
                loadedXlsxFiles: new Set(get().loadedXlsxFiles).add(xlsxFileName),
                xlsx: {
                    ...get().xlsx,
                    [xlsxFileName]: {
                        talons,
                        status: 'NotStarted',
                    },
                },
                downloadState: {
                    ...get().downloadState,
                    [xlsxFileName]: downloadInfo,
                },
            });
        },
        setSelectedXlsxFile: (xlsxFileName: string) => {
            return set({
                selectedXlsxFile: xlsxFileName,
            });
        },
        startDownloadingTalons: async () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            window.electronAPI.downloadTalons(get().xlsx[selectedXlsxFile].talons, selectedXlsxFile);
            return set({
                xlsx: {
                    ...get().xlsx,
                    [selectedXlsxFile]: {
                        ...get().xlsx[selectedXlsxFile],
                        status: 'InProgress',
                    },
                },
            });
        },
        stopDownloadingTalons: async () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            window.electronAPI.abortDownloadTalons();
            return set({
                xlsx: {
                    ...get().xlsx,
                    [selectedXlsxFile]: {
                        ...get().xlsx[selectedXlsxFile],
                        status: 'Stopped',
                    },
                },
            });
        },
        resumeDownloadingTalons: async () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            window.electronAPI.downloadTalons(get().xlsx[selectedXlsxFile].talons, selectedXlsxFile);
            return set({
                xlsx: {
                    ...get().xlsx,
                    [selectedXlsxFile]: {
                        ...get().xlsx[selectedXlsxFile],
                        status: 'InProgress',
                    },
                },
            });
        },
        completeDownloadingTalons: () => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            return set({
                xlsx: {
                    ...get().xlsx,
                    [selectedXlsxFile]: {
                        ...get().xlsx[selectedXlsxFile],
                        status: 'Completed',
                    },
                },
            });
        },
        updateDownloadStatus: (talonId: string, status: DownloadStatus) => {
            const selectedXlsxFile = get().selectedXlsxFile;
            if (!selectedXlsxFile) {
                return;
            }
            const downloadState = get().downloadState[selectedXlsxFile];
            if (status.status === 'Failed') {
                downloadState.failed++;
            } else if (status.status === 'Completed') {
                downloadState.completed++;
            }
            downloadState.statuses = {
                ...downloadState.statuses,
                [talonId]: status,
            };
            return set({
                downloadState: {
                    ...get().downloadState,
                    [selectedXlsxFile]: downloadState,
                },
            });
        },
    };
}
