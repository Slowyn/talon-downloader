import {create} from 'zustand';
import {TalonSheetSchema} from '@/shared/TalonSchema';

type DownloadStatus =
    | {
          status: 'NotStarted' | 'InProgress' | 'Completed';
      }
    | {
          status: 'Failed';
          error: string;
      };

export type AppState = {
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
    selectedXlsxFile: undefined,
    loadedXlsxFiles: new Set(),
    xlsx: {},
    downloadState: {},
};

export const useAppState = create<AppState>(() => defaultState);
