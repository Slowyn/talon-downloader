import {FC, useEffect, useState} from 'react';
import * as xlsx from 'xlsx';

import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {TalonSchema, TalonSheetSchema, talonSheetSchema} from '@/shared/TalonSchema';
import {TalonDownloadProgressInfo} from '@/shared/Download';

function readSheets(file: File): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = event.target?.result;
            if (data) {
                const workbook = xlsx.read(data, {type: 'array'});
                const json = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as Record<
                    string,
                    string
                >[];
                resolve(json);
            }
        };
        reader.onerror = (event) => {
            reject(event);
        };
        reader.readAsArrayBuffer(file);
    });
}

export const App = () => {
    const [xlsxFile, setXlsxFile] = useState<File | undefined>(undefined);
    const [sheets, setSheets] = useState<TalonSheetSchema | undefined>(undefined);
    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setXlsxFile(event.target.files?.[0]);
    };
    useEffect(() => {
        if (xlsxFile) {
            readSheets(xlsxFile).then((data) => {
                const parseResult = talonSheetSchema.safeParse(data);
                if (parseResult.success) {
                    const data = parseResult.data;
                    setSheets(data);
                } else {
                    console.error(parseResult.error);
                }
            });
        }
    }, [xlsxFile]);

    return (
        <div>
            <Input id="sheets" type="file" onChange={onFileChange} accept=".xlsx" />
            {xlsxFile && sheets && <DownloadTalons talons={sheets} xlsxFileName={xlsxFile.name} />}
        </div>
    );
};

type DownloadTalonsProps = {
    talons: TalonSheetSchema;
    xlsxFileName: string;
};
function calculateProgress(progress: TalonDownloadProgressInfo | undefined): number {
    if (!progress) {
        return 0;
    }
    return Math.round((progress.completed / progress.total) * 100);
}
const DownloadTalons: FC<DownloadTalonsProps> = (props) => {
    const {talons, xlsxFileName} = props;
    const [isDownloading, setIsDownloading] = useState(false);
    const [progress, setProgress] = useState<TalonDownloadProgressInfo | undefined>(undefined);
    const [error, setError] = useState<Error | undefined>(undefined);
    const progressValue = calculateProgress(progress);

    useEffect(() => {
        window.electronAPI.onDownloadTalonsStart(() => {
            console.log('DownloadTalons: onDownloadTalonsStart');
            setIsDownloading(true);
        });
    }, []);

    useEffect(() => {
        window.electronAPI.onDownloadTalonProgress((downloadInfo: TalonDownloadProgressInfo) => {
            console.log('DownloadTalons: onDownloadTalonProgress', downloadInfo);
            setProgress(downloadInfo);
        });
    }, []);

    useEffect(() => {
        window.electronAPI.onDownloadTalonError((error: Error) => {
            console.log('DownloadTalons: onDownloadTalonError', error);
            setError(error);
        });
    }, []);

    useEffect(() => {
        window.electronAPI.onDownloadTalonComplete(() => {
            console.log('DownloadTalons: onDownloadTalonComplete');
            setIsDownloading(false);
            setProgress(undefined);
        });
    }, []);

    return (
        <div>
            <div>Всего талонов: {talons.length}</div>
            {isDownloading && (
                <div>
                    Талонов скачано: {progress?.completed} ({progressValue}%)
                </div>
            )}
            {isDownloading && <Progress value={progressValue} />}
            {error && <pre>{error.message}</pre>}
            <Button disabled={isDownloading} onClick={() => downloadTalons(talons, xlsxFileName)}>
                Скачать талоны
            </Button>
            {isDownloading && (
                <Button variant={'destructive'} onClick={window.electronAPI.abortDownloadTalons}>
                    Отменить скачивание
                </Button>
            )}
        </div>
    );
};

async function downloadTalons(talons: TalonSheetSchema, xlsxFileName: string) {
    window.electronAPI.downloadTalons(talons, xlsxFileName);
}
