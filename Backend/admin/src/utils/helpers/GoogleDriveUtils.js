const { google } = require('googleapis');

class GoogleDriveUtils {
    //Get googleapis instance
    initConection({ client_id, client_secret, refresh_token }) {
        const oauth2Client = new google.auth.OAuth2(client_id, client_secret, '');
        oauth2Client.setCredentials({ access_token: '', refresh_token });
        google.options({ auth: oauth2Client });

        return google.drive({ version: 'v3', auth: oauth2Client });
    }

    checkAccess(creds) {
        const drive = this.initConection(creds);

        return drive.files.list();
    }
}

module.exports = new GoogleDriveUtils();