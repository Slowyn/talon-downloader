export type DownlodStatus =
    | {
          status: 'NotStarted' | 'InProgress' | 'Completed';
      }
    | {
          status: 'Failed';
          error: string;
      };

export type IDownloadCache = {
    readonly xlsxFileName: string;
    readonly talonIds: string[];
    total: number;
    completed: number;
    failed: number;
    statuses: {
        [talonId: string]: DownlodStatus;
    };
};

export class DownloadCache implements IDownloadCache {
    total: number;
    completed: number;
    failed: number;
    statuses: {
        [talonId: string]: DownlodStatus;
    };
    constructor(
        public readonly xlsxFileName: string,
        public readonly talonIds: string[],
    ) {
        this.total = talonIds.length;
        this.completed = 0;
        this.failed = 0;
        this.statuses = talonIds.reduce(
            (acc, talonId) => ({
                ...acc,
                [talonId]: {
                    status: 'NotStarted',
                },
            }),
            {},
        );
    }

    public isCompleted(talonId: string) {
        return this.statuses[talonId].status === 'Completed';
    }

    public isFailed(talonId: string) {
        return this.statuses[talonId].status === 'Failed';
    }

    public has(talonId: string | number): talonId is keyof typeof this.statuses {
        return this.statuses[talonId] !== undefined;
    }

    public complete(talonId: string) {
        if (this.has(talonId)) {
            if (this.isCompleted(talonId)) {
                return;
            }
            this.statuses[talonId] = {
                status: 'Completed',
            };
            this.completed++;
        }
        return this.statuses[talonId];
    }

    public fail(talonId: string, error: string) {
        if (this.has(talonId)) {
            if (!this.isFailed(talonId)) {
                this.failed++;
            }
            this.statuses[talonId] = {
                status: 'Failed',
                error,
            };
            return this.statuses[talonId];
        }
    }

    public get(talonId: string) {
        return this.statuses[talonId];
    }

    public getProgress() {
        const {total, completed, failed} = this;
        return {
            total,
            completed,
            failed,
            progress: completed / total,
        };
    }

    public getUncompletedTalons() {
        return this.talonIds.filter((talonId) => !this.isCompleted(talonId));
    }
}
