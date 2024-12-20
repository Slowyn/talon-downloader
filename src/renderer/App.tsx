import {FC, useCallback, useEffect, useMemo} from 'react';

import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {TalonDownloadProgressInfo} from '@/shared/Download';

import {useAppState} from '@/renderer/state/app.state';
import {createAppActions} from '@/renderer/state/app.actions';
import {
    getTalonsDownloadProgress,
    getCurrentDownloadStatus,
    getSelectedXlsxFile,
    getTalonsDowloadStatuses,
    getDownloadPercent,
} from '@/renderer/state/app.selectors';

export const App = () => {
    const xlsxFile = useAppState(getSelectedXlsxFile);
    const actions = createAppActions(useAppState.getState, useAppState.setState);
    const onFileChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                actions.setXlsxFile(file);
            }
        },
        [actions],
    );

    return (
        <div>
            <Input id="sheets" type="file" onChange={onFileChange} accept=".xlsx, .csv" />
            {xlsxFile && <DownloadTalons />}
        </div>
    );
};

const DownloadTalons: FC = () => {
    const downloadStatus = useAppState(getCurrentDownloadStatus);
    const progress = useAppState(getTalonsDownloadProgress);
    const xlsxFileName = useAppState(getSelectedXlsxFile);
    const talonsStatuses = useAppState(getTalonsDowloadStatuses);
    const progressValue = useAppState(getDownloadPercent);
    const actions = useMemo(() => createAppActions(useAppState.getState, useAppState.setState), []);

    useEffect(() => {
        // TODO: Implement unsubscribe!
        window.electronAPI.onDownloadTalonProgress((downloadInfo: TalonDownloadProgressInfo) => {
            actions.updateDownloadStatus(downloadInfo.item.talonId, {status: 'Completed'});
        });
    }, [actions]);

    useEffect(() => {
        window.electronAPI.onDownloadTalonError((downloadInfo: TalonDownloadProgressInfo, error: Error) => {
            actions.updateDownloadStatus(downloadInfo.item.talonId, {status: 'Completed'});
        });
    }, [actions]);

    useEffect(() => {
        window.electronAPI.onDownloadTalonsComplete(() => {
            actions.completeDownloadingTalons();
        });
    }, [actions]);

    return (
        <div>
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
