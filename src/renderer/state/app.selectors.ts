import {AppState} from '@/renderer/state/app.state';

export const DEFAULT_TALONS: AppState['xlsx'][string]['talons'] = [];
export function getTalonsList(state: AppState) {
    const xlsxFileName = state.selectedXlsxFile;
    if (!xlsxFileName) {
        return DEFAULT_TALONS;
    }
    return state.xlsx[xlsxFileName].talons;
}

const DEFAULT_STATUS: AppState['downloadState'][string]['statuses'] = {};
export function getTalonsDowloadStatuses(state: AppState) {
    const xlsxFileName = state.selectedXlsxFile;
    if (!xlsxFileName) {
        return DEFAULT_STATUS;
    }
    return state.downloadState[xlsxFileName].statuses;
}

const DEFAULT_PROGRESS = {
    total: 0,
    completed: 0,
    failed: 0,
};
export function getTalonsDownloadProgress(state: AppState) {
    const xlsxFileName = state.selectedXlsxFile;
    if (!xlsxFileName) {
        return DEFAULT_PROGRESS;
    }
    return state.downloadState[xlsxFileName];
}

export function getDownloadPercent(state: AppState) {
    const progress = getTalonsDownloadProgress(state);
    if (!progress) {
        return 0;
    }
    const {total, completed} = progress;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
}

export function getCurrentDownloadStatus(state: AppState) {
    const xlsxFileName = state.selectedXlsxFile;
    if (!xlsxFileName) {
        return 'NotStarted';
    }
    return state.xlsx[xlsxFileName].status;
}

export function getSelectedXlsxFile(state: AppState) {
    return state.selectedXlsxFile;
}
