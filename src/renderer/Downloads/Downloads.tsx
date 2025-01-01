import {FC, useMemo} from 'react';

import {getTalonsList, getTalonsDowloadStatuses} from '@/renderer/state/app.selectors';
import {useAppState} from '@/renderer/state/app.state';

import {columns, type DownloadRow} from './columns';
import {DataTable} from './data-table';

const getRowStatus = (rowData: DownloadRow) => {
    if (rowData.status === 'Completed') {
        return 'Completed';
    }
    if (rowData.status === 'Failed') {
        return 'Failed';
    }
    return 'Pending';
};

export const Downloads: FC = () => {
    const talons = useAppState(getTalonsList);
    const talonsStatuses = useAppState(getTalonsDowloadStatuses);
    const data = useMemo(
        () =>
            talons.map((talon) => ({
                id: talon['#'].toString(),
                status: talonsStatuses[talon['#']].status,
            })),
        [talons, talonsStatuses],
    );
    return <DataTable columns={columns} data={data} getRowStatus={getRowStatus} />;
};
