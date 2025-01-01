import {DownloadStatus} from '@/shared/Download';
import {ColumnDef} from '@tanstack/react-table';

export type DownloadRow = {
    id: string;
    status: DownloadStatus['status'];
};
function mapStatusToLabel(status: DownloadStatus['status']) {
    const dict: Record<DownloadStatus['status'], string> = {
        NotStarted: 'Не скачан',
        InProgress: 'Скачивается',
        Completed: 'Скачан',
        Failed: 'Произошла ошибка',
    };

    return dict[status];
}

export const columns: ColumnDef<DownloadRow>[] = [
    {
        accessorKey: 'id',
        header: 'Номер талона',
    },
    {
        accessorKey: 'status',
        header: () => <div className="text-right">Статус</div>,
        cell: ({row}) => {
            return <div className="text-right font-medium">{mapStatusToLabel(row.original.status)}</div>;
        },
    },
];
