const REDMINE_BASE_URL = 'https://grunt.rm.mosreg.ru';
export class RedmineApi {
    constructor(
        private token: string,
        private reserveToken: string,
    ) {}
    private async getTalonInner(talonId: string, token: string): Promise<Response> {
        const response = await fetch(`${REDMINE_BASE_URL}/issues/${talonId}.pdf`, {
            method: 'GET',
            redirect: 'follow',
            headers: {
                'X-Redmine-API-Key': token,
            },
        });
        return response;
    }
    public async getTalon(talonId: string) {
        const response = await this.getTalonInner(talonId, this.token).then((response) => {
            if (response.status === 403) {
                return this.getTalonInner(talonId, this.reserveToken);
            }
            return response;
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
