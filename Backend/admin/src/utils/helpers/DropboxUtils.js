const { Dropbox } = require('dropbox');
const fetch = require('isomorphic-fetch');

class DropboxUtils {
    /**
     * Check if Dropbox access token is valid
     * @param {Object} creds - Credentials object containing access_token
     * @returns {Promise} - Promise that resolves if access is valid, rejects if not
     */
    static async checkAccess(creds) {
        try {
            const { access_token } = creds;
            
            if (!access_token) {
                throw new Error('Access token is required');
            }

            const dbx = new Dropbox({
                accessToken: access_token,
                fetch: fetch
            });

            // Test the access token by making a simple API call
            const response = await dbx.usersGetCurrentAccount();
            
            if (response && response.account_id) {
                return Promise.resolve();
            } else {
                throw new Error('Invalid access token');
            }
        } catch (error) {
            console.error('Dropbox access check failed:', error);
            return Promise.reject(error);
        }
    }

    /**
     * Initialize Dropbox connection
     * @param {Object} creds - Credentials object containing access_token
     * @param {string} organization_id - Organization ID
     * @returns {Object} - Connection object with dbx client and organization_id
     */
    static initConnection(creds, organization_id) {
        const { access_token } = creds;
        
        if (!access_token) {
            throw new Error('Access token is required');
        }

        const dbx = new Dropbox({
            accessToken: access_token
        });

        return {
            dbx: dbx,
            organization_id: organization_id
        };
    }

    /**
     * Test Dropbox connection by listing root folder
     * @param {Object} creds - Credentials object containing access_token
     * @returns {Promise} - Promise that resolves if connection is successful
     */
    static async testConnection(creds) {
        try {
            const { access_token } = creds;
            
            if (!access_token) {
                throw new Error('Access token is required');
            }

            const dbx = new Dropbox({
                accessToken: access_token,
                fetch: fetch
            });

            // Test connection by listing root folder
            await dbx.filesListFolder({
                path: '',
                recursive: false,
                include_media_info: false,
                include_deleted: false,
                include_has_explicit_shared_members: false,
                include_mounted_folders: true,
                include_non_downloadable_files: true,
                limit: 1
            });

            return Promise.resolve();
        } catch (error) {
            console.error('Dropbox connection test failed:', error);
            return Promise.reject(error);
        }
    }
}

module.exports = DropboxUtils;
