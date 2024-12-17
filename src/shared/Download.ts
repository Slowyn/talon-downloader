export type DownloadProgressInfo<T> = {
    failed: number;
    completed: number;
    total: number;
    item: T;
};

export const downloadProgressInfo = <T>(
    completed: number,
    failed: number,
    total: number,
    item: T,
): DownloadProgressInfo<T> => ({
    failed,
    completed,
    total,
    item,
});

export type TalonDownloadProgressInfo = DownloadProgressInfo<{
    talonId: string;
}>;
