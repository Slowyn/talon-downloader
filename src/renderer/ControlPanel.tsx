import {FC, useEffect, useMemo} from 'react';

import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {createAppActions} from '@/renderer/state/app.actions';
import {
    getCurrentDownloadStatus,
    getDownloadPercent,
    getSelectedXlsxFile,
    getTalonsDownloadProgress,
} from '@/renderer/state/app.selectors';
import {useAppState} from '@/renderer/state/app.state';
import {TalonDownloadProgressInfo} from '@/shared/Download';

export const ControlPanel: FC = () => {
    const downloadStatus = useAppState(getCurrentDownloadStatus);
    const progress = useAppState(getTalonsDownloadProgress);
    const xlsxFileName = useAppState(getSelectedXlsxFile);
    const progressValue = useAppState(getDownloadPercent);
    const actions = useMemo(() => createAppActions(useAppState.getState, useAppState.setState), []);

    useEffect(() => {
        return window.electronAPI.onDownloadTalonStart((downloadInfo) => {
            actions.updateDownloadStatus(downloadInfo, {status: 'InProgress'});
        });
    }, [actions]);

    useEffect(() => {
        return window.electronAPI.onDownloadTalonProgress((downloadInfo: TalonDownloadProgressInfo) => {
            actions.updateDownloadStatus(downloadInfo, {status: 'Completed'});
        });
    }, [actions]);

    useEffect(() => {
        return window.electronAPI.onDownloadTalonError((downloadInfo: TalonDownloadProgressInfo, error: string) => {
            actions.updateDownloadStatus(downloadInfo, {status: 'Failed', error});
        });
    }, [actions]);

    useEffect(() => {
        return window.electronAPI.onDownloadTalonsComplete(() => {
            actions.completeDownloadingTalons();
        });
    }, [actions]);

    return (
        <div className="flex flex-col gap-2">
            <div>Файл: {xlsxFileName}</div>
            <div>Всего талонов: {progress.total}</div>
            <div>
                Талонов скачано: {progress.completed} ({progressValue}%)
            </div>
            <div>Не удалось загрузить: {progress.failed}</div>
            <Progress value={progressValue} />
            {downloadStatus === 'NotStarted' && (
                <Button disabled={downloadStatus !== 'NotStarted'} onClick={actions.startDownloadingTalons}>
                    Скачать талоны
                </Button>
            )}
            {downloadStatus === 'InProgress' && (
                <Button variant={'destructive'} onClick={actions.stopDownloadingTalons}>
                    Пауза
                </Button>
            )}
            {downloadStatus === 'Stopped' && (
                <Button variant={'destructive'} onClick={actions.resumeDownloadingTalons}>
                    Продолжить скачивание
                </Button>
            )}
            {downloadStatus === 'Completed' && <Button>Все талоны загружены</Button>}
        </div>
    );
};
