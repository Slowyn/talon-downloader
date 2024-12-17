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
    loadedXlsxFiles: Set<string>;
    xlsx: {
        [xlsxFileName: string]: {
            talons: TalonSheetSchema;
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
    loadedXlsxFiles: new Set(),
    xlsx: {},
    downloadState: {},
};

function addXlsxFile(state: AppState, xlsxFileName: string, talons: TalonSheetSchema) {
    if (state.loadedXlsxFiles.has(xlsxFileName)) {
        return;
    }
    state.loadedXlsxFiles.add(xlsxFileName);
    state.xlsx[xlsxFileName] = {
        talons,
    };
}
