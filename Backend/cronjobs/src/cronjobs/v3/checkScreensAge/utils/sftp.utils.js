const SftpClient = require("ssh2-sftp-client");

const fs = require("fs");
const path = require("path");
const moment = require('moment-timezone');


let sftpConnections = {};
let sftpStorageCache = {}; // Cache storage configs for reconnection

class sftpServices {
    constructor() {
        this.client;
        this.domain = this.getDomain();
    }

    getDomain() {
        const {
            NODE_ENV: env,
            API_URL_LOCAL: localDomain,
            API_URL_DEV: devDomain,
            API_URL_PRODUCTION: prodDomain,
        } = process.env;

        switch (env) {
            case 'production':
                return `https://${prodDomain}/api/v3`;
            case 'development':
                return `https://${devDomain}/api/v3`;
            default:
                return `http://${localDomain}/api/v3`;
        }
    }

    async initConection(storage, organization_id) {
        try {
            if (Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
                this.client = sftpConnections[`Storage_${organization_id}`];
                this.clientPath = storage.ftp_path;
                // Verify connection is still alive
                try {
                    await this.client.list(this.clientPath);
                    return this.client;
                } catch (error) {
                    console.error(`SFTP_ERROR: Connection for org ${organization_id} is dead, reconnecting...`);
                    delete sftpConnections[`Storage_${organization_id}`];
                    // Fall through to create new connection
                }
            }
            const sftp = new SftpClient();
            let creds = {
                host: storage.host,
                port: storage.port,
                username: storage.username,
            };
            if (storage.pemPath) creds['privateKey'] = Buffer.from(storage.pemPath.replace(/\\n/g, '\n'), 'utf-8');
            if (storage.password) creds['password'] = storage.password;
            await sftp.connect(creds);
            sftpConnections[`Storage_${organization_id}`] = sftp;
            sftpStorageCache[`Storage_${organization_id}`] = storage; // Cache storage for reconnection
            this.client = sftp;
            this.clientPath = storage.ftp_path;
            return this.client;
        } catch (error) {
            console.error(`SFTP_ERROR: Failed to initialize connection for org ${organization_id}: ${error.message}`);
            throw error;
        }
    };

    deleteCreds(organization_id) {
        if (Object.keys(sftpConnections).includes(`Storage_${organization_id}`)) {
            delete sftpConnections[`Storage_${organization_id}`];
        }
        if (Object.keys(sftpStorageCache).includes(`Storage_${organization_id}`)) {
            delete sftpStorageCache[`Storage_${organization_id}`];
        }
    }

    async getMainFolderId(connection, folderName) {
        try {
            const exists = await this.client.exists(`${this.clientPath}/${folderName}`);
            return exists;
        } catch (error) {
            console.error(`SFTP_ERROR: Failed to check main folder ${folderName}: ${error.message}`);
            return false;
        }
    }

    /**
     * Retry mechanism for SFTP operations
     * @param {Function} operation - Async function to retry
     * @param {number} maxRetries - Maximum number of retries (default: 3)
     * @param {number} delayMs - Delay between retries in milliseconds (default: 1000)
     * @returns {Promise} Result of the operation
     */
    async retryOperation(operation, maxRetries = 3, delayMs = 1000) {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    const delay = delayMs * attempt; // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }

    /**
     * Check if SFTP connection is alive and reconnect if needed
     */
    async ensureConnection(organization_id) {
        try {
            await this.client.list(this.clientPath);
        } catch (error) {
            const storage = sftpStorageCache[`Storage_${organization_id}`];
            if (!storage) {
                throw new Error(`Storage config not found for organization ${organization_id}`);
            }
            await this.initConection(storage, organization_id);
        }
    }

    /**
     * Validate if a string is a valid date folder name (YYYY-MM-DD format)
     */
    isValidDateFolder(folderName) {
        if (!folderName || typeof folderName !== 'string') return false;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(folderName)) return false;
        const parsed = moment(folderName, "YYYY-MM-DD", true);
        return parsed.isValid();
    }

    async getUsersFolders(connection, ssss, ssLastDate, organization_id) {
        const stats = {
            totalUsers: 0,
            processedUsers: 0,
            failedUsers: 0,
            totalDateFolders: 0,
            deletedFolders: 0,
            failedDeletions: 0,
            errors: []
        };

        try {
            // Get storage config from cache
            const storage = sftpStorageCache[`Storage_${organization_id}`];
            if (!storage) {
                throw new Error(`Storage config not found for organization ${organization_id}`);
            }

            // Ensure connection is alive
            await this.ensureConnection(organization_id);

            // Get list of user folders with retry
            let userFolderList;
            try {
                userFolderList = await this.retryOperation(
                    () => this.client.list(`${this.clientPath}/EmpMonitor`),
                    3,
                    1000
                );
            } catch (error) {
                console.error(`SFTP_ERROR: Failed to list user folders from ${this.clientPath}/EmpMonitor: ${error.message}`);
                stats.errors.push(`Failed to list user folders: ${error.message}`);
                return stats;
            }

            if (!userFolderList || !Array.isArray(userFolderList)) {
                return stats;
            }

            stats.totalUsers = userFolderList.length;

            // Process each user folder independently - continue even if one fails
            for (const userEmail of userFolderList) {
                try {
                    // Validate user folder name
                    if (!userEmail || !userEmail.name) {
                        stats.failedUsers++;
                        continue;
                    }

                    const userFolderPath = `${this.clientPath}/EmpMonitor/${userEmail.name}`;
                    
                    // Ensure connection is still alive before processing user
                    await this.ensureConnection(organization_id);

                    // Get date folders for this user with retry
                    let dateFolders;
                    try {
                        dateFolders = await this.retryOperation(
                            () => this.client.list(userFolderPath),
                            3,
                            1000
                        );
                    } catch (error) {
                        console.error(`SFTP_ERROR: Failed to list date folders for user ${userEmail.name}: ${error.message}`);
                        stats.failedUsers++;
                        stats.errors.push(`User ${userEmail.name}: Failed to list date folders - ${error.message}`);
                        continue; // Continue with next user
                    }

                    if (!dateFolders || !Array.isArray(dateFolders)) {
                        stats.processedUsers++;
                        continue;
                    }

                    stats.totalDateFolders += dateFolders.length;

                    // Process each date folder independently
                    for (const dateFolder of dateFolders) {
                        try {
                            // Validate date folder name
                            if (!dateFolder || !dateFolder.name) {
                                continue;
                            }

                            // Validate date format
                            if (!this.isValidDateFolder(dateFolder.name)) {
                                continue;
                            }

                            // Convert date.name to a moment object for comparison
                            const folderDate = moment(dateFolder.name, "YYYY-MM-DD", true);
                            
                            if (!folderDate.isValid()) {
                                continue;
                            }

                            // Check if folder date is before ssLastDate
                            if (folderDate.isBefore(ssLastDate, 'day')) {
                                const folderPath = `${userFolderPath}/${dateFolder.name}`;
                                
                                // Ensure connection is still alive before deletion
                                await this.ensureConnection(organization_id);

                                // Delete folder with retry mechanism
                                try {
                                    await this.retryOperation(
                                        async () => {
                                            const exists = await this.client.exists(folderPath);
                                            if (!exists) {
                                                return;
                                            }
                                            await this.client.rmdir(folderPath, true);
                                        },
                                        3,
                                        1000
                                    );
                                    stats.deletedFolders++;
                                } catch (error) {
                                    stats.failedDeletions++;
                                    stats.errors.push(`${folderPath}: ${error.message}`);
                                }
                            }
                        } catch (error) {
                            stats.failedDeletions++;
                            stats.errors.push(`${userEmail.name}/${dateFolder?.name}: ${error.message}`);
                            // Continue with next date folder
                        }
                    }

                    stats.processedUsers++;
                } catch (error) {
                    stats.failedUsers++;
                    stats.errors.push(`User ${userEmail?.name}: ${error.message}`);
                    // Continue with next user
                }
            }

            // Log summary
            if (stats.failedDeletions > 0 || stats.failedUsers > 0) {
                console.error(`SFTP_ERROR: Processed ${stats.processedUsers}/${stats.totalUsers} users, ` +
                             `Deleted ${stats.deletedFolders} folders, ` +
                             `Failed: ${stats.failedDeletions} deletions, ${stats.failedUsers} users`);
                if (stats.errors.length > 0) {
                    stats.errors.slice(0, 5).forEach((error) => {
                        console.error(`SFTP_ERROR: ${error}`);
                    });
                    if (stats.errors.length > 5) {
                        console.error(`SFTP_ERROR: ... and ${stats.errors.length - 5} more errors`);
                    }
                }
            } else {
                console.log(`SFTP_SUCCESS: Processed ${stats.processedUsers}/${stats.totalUsers} users, deleted ${stats.deletedFolders} folders`);
            }

            return stats;
        } catch (error) {
            console.error(`SFTP_ERROR: Critical error in getUsersFolders: ${error.message}`);
            stats.errors.push(`Critical error: ${error.message}`);
            throw error;
        }
    }

    checkMainFolder() {
        return true;
    }

    async checkAccess() {
        const sftp = new SftpClient();
        await sftp.connect({
            host: storage.host,
            port: storage.port,
            username: storage.username,
            privateKey: Buffer.from(storage.pemPath.replace(/\\n/g, '\n'), 'utf-8'),
        });
        await sftp.end();
    }
}


module.exports = new sftpServices;