import {create} from 'zustand';
import {immer} from 'zustand/middleware/immer';
import {TalonSheetSchema} from '@/shared/TalonSchema';
import {DownloadStatus} from '@/shared/Download';

export type AppState = {
    isXlsxLoading: boolean;
    selectedXlsxFile: string | undefined;
    loadedXlsxFiles: Set<string>;
    xlsx: {
        [xlsxFileName: string]: {
            talons: TalonSheetSchema;
            status: 'NotStarted' | 'InProgress' | 'Stopped' | 'Completed';
        };
    };
    downloadState: {
        [xlsxFileName: string]: {
            total: number;
            completed: number;
            failed: number;
            statuses: {
                [talonId: string]: DownloadStatus;
            };
        };
    };
};

export const defaultState: AppState = {
    isXlsxLoading: false,
    selectedXlsxFile: undefined,
    loadedXlsxFiles: new Set(),
    xlsx: {},
    downloadState: {},
};

export const useAppState = create<AppState>()(immer(() => defaultState));

export type StoreApi = typeof useAppState;
export type StoreSetState = StoreApi['setState'];
export type StoreGetState = StoreApi['getState'];
