import * as xlsx from 'xlsx';

export function readSheets(file: File): Promise<Record<string, string>[]> {
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
