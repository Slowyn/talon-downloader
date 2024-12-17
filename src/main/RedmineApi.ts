const REDMINE_BASE_URL = 'https://grunt.rm.mosreg.ru';
export class RedmineApi {
    constructor(private token: string) {}
    public async getTalon(talonId: string) {
        const response = await fetch(`${REDMINE_BASE_URL}/issues/${talonId}.pdf`, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'X-Redmine-API-Key': this.token,
            },
        });
        if (!response.ok) {
            const error = await response.text();
            console.error(error);
            throw new Error(error);
        }
        const blob = await response.blob();
        const blobArray = await blob.arrayBuffer();
        return new Uint8Array(blobArray);
    }
}
