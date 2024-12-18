import {AppState} from '@/renderer/state/app.state';

export function getTalonsDowloadStatuses(state: AppState) {
    const xlsxFileName = state.selectedXlsxFile;
    if (!xlsxFileName) {
        return {};
    }
    return state.downloadState[xlsxFileName].statuses;
}

export function getTalonsDownloadProgress(state: AppState) {
    const xlsxFileName = state.selectedXlsxFile;
    if (!xlsxFileName) {
        return {
            total: 0,
            completed: 0,
            failed: 0,
        };
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
