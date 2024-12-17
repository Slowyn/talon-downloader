export function makeFileName(talonId: string) {
    return `elektronnye_talony_na_vyvoz_ossig-${talonId}.pdf`;
}
export function getTalonIdFromFileName(fileName: string) {
    return fileName.split('-')[1].split('.')[0];
}
const talonFileRegexp = /elektronnye_talony_na_vyvoz_ossig-(\d+).pdf/;
export function testTalonFileFormat(fileName: string) {
    return talonFileRegexp.test(fileName);
}
export function makeFolderName(xlsxFileName: string) {
    return `folder_${xlsxFileName}`;
}
