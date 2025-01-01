import {FC, useCallback, useEffect, useMemo} from 'react';

import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Progress} from '@/components/ui/progress';
import {ScrollArea} from '@/components/ui/scroll-area';
import {TalonDownloadProgressInfo} from '@/shared/Download';

import {cn} from '@/lib/utils';
import {createAppActions} from '@/renderer/state/app.actions';
import {
    getCurrentDownloadStatus,
    getDownloadPercent,
    getSelectedXlsxFile,
    getTalonsDownloadProgress,
} from '@/renderer/state/app.selectors';
import {useAppState} from '@/renderer/state/app.state';

import {Downloads} from '@/renderer/Downloads/Downloads';

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
        <div className={cn('grid grid-cols-6 gap-4 h-full')}>
            <div className="col-span-2">
                <Input id="sheets" type="file" onChange={onFileChange} accept=".xlsx, .csv" />
                {xlsxFile && <ControlPanel />}
            </div>
            <div className="col-span-4 h-full overflow-hidden">
                <ScrollArea className="h-full">
                    <Downloads />
                </ScrollArea>
            </div>
        </div>
    );
};

const ControlPanel: FC = () => {
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
