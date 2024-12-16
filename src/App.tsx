import {FC, useEffect, useState} from 'react';
import * as xlsx from 'xlsx';

import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {TalonSheetSchema, talonSheetSchema} from '@/shared/TalonSchema';

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
            console.log(xlsxFile);
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
            {sheets && <DownloadTalons talons={sheets} />}
        </div>
    );
};

type DownloadTalonsProps = {
    talons: TalonSheetSchema;
};
const DownloadTalons: FC<DownloadTalonsProps> = (props) => {
    const {talons} = props;
    return (
        <div>
            <Button onClick={() => downloadTalons(talons)}>Download</Button>
        </div>
    );
};

async function downloadTalons(talons: TalonSheetSchema) {
    console.log(window);
    window.electronAPI.downloadTalons(talons);
}
