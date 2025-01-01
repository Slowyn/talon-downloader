import {FC, useMemo} from 'react';

import {Skeleton} from '@/components/ui/skeleton';
import {getTalonsList, getTalonsDowloadStatuses, getIsXlsxLoading} from '@/renderer/state/app.selectors';
import {useAppState} from '@/renderer/state/app.state';

import {columns, type DownloadRow} from './columns';
import {DataTable} from './data-table';

const getRowStatus = (rowData: DownloadRow) => {
    return rowData.status;
};

export const Downloads: FC = () => {
    const talons = useAppState(getTalonsList);
    const talonsStatuses = useAppState(getTalonsDowloadStatuses);
    const isXlsxLoading = useAppState(getIsXlsxLoading);
    const data = useMemo(
        () =>
            talons.map((talon) => ({
                id: talon['#'].toString(),
                status: talonsStatuses[talon['#']].status,
            })),
        [talons, talonsStatuses],
    );
    if (isXlsxLoading) {
        return (
            <div className="flex flex-col space-y-3">
                <Skeleton className="rounded-md border h-10" />
                <Skeleton className="rounded-md border h-[300px]" />
            </div>
        );
    }
    return <DataTable columns={columns} data={data} getRowStatus={getRowStatus} />;
};
