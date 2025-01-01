import {DownloadStatus} from '@/shared/Download';
import {ColumnDef} from '@tanstack/react-table';

export type DownloadRow = {
    id: string;
    status: DownloadStatus['status'];
};

export const columns: ColumnDef<DownloadRow>[] = [
    {accessorKey: 'id', header: 'Номер талона'},
    {accessorKey: 'status', header: 'Статус'},
];
