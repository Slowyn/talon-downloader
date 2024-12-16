export type DownloadProgressInfo<T> = {
    completed: number;
    total: number;
    item: T;
};

export const downloadProgressInfo = <T>(completed: number, total: number, item: T): DownloadProgressInfo<T> => ({
    completed,
    total,
    item,
});
