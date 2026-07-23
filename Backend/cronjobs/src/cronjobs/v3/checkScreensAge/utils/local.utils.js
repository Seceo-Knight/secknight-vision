const fs = require('fs').promises;
const path = require('path');
const moment = require('moment');

/**
 * Local-disk ("LC") storage provider retention handler.
 *
 * Every other provider in this folder (S3/GoogleDrive/OneDrive/FTP/SFTP/
 * ZohoWorkDrive/WebDav) organizes files as mainFolder/email/YYYY-MM-DD/...
 * (a per-day sub-folder under each employee), which is what the generic
 * getMainFolderId -> getUsersFolders -> getFoldersIdByParentId -> removeFile
 * tree-walk in checkScreensAge.service.js assumes.
 *
 * The local-disk provider (Backend/store-logs-api/.../utils/local-storage.utils.ts,
 * Backend/admin/.../cloudstorageServices/local.service.js) uses a FLAT layout
 * instead - mainFolder/email/<filename>, with the date baked into the
 * filename itself ("HH-YYYY-MM-DD HH-mm-ss[-scN].ext") rather than a
 * subfolder. So instead of forcing it through the shared tree-walk
 * interface, checkScreensAge.service.js special-cases LC (the same way it
 * already special-cases S3) and calls deleteOldFiles() directly.
 */
class LocalStorage {
    // Must match Backend/store-logs-api's mainFolderNames constant exactly
    // (constants.ts: screenshots -> 'EmpMonitor', screenRecords -> 'EmpMonitorRecords').
    static MAIN_FOLDERS = ['EmpMonitor', 'EmpMonitorRecords'];

    getRoot() {
        // Must match store-logs-api's LOCAL_STORAGE_PATH exactly - see deploy.sh,
        // where the same absolute path is written to both services' .env files.
        return path.resolve(process.env.LOCAL_STORAGE_PATH || './public/local-storage');
    }

    async initConection() {
        return { root: this.getRoot() };
    }

    // Filenames look like "14-2026-07-23 14-05-10-sc0.png" or
    // "14-2026-07-23 14-05-10.mp4" - parts[1..3] give YYYY, MM, and
    // "DD HH-mm-ss..." (split on the space to isolate DD).
    fileDateFromName(filename) {
        const parts = filename.split('-');
        if (parts.length < 4) return null;
        const day = parts[3].split(' ')[0];
        const parsed = moment(`${parts[1]}-${parts[2]}-${day}`, 'YYYY-MM-DD', true);
        return parsed.isValid() ? parsed : null;
    }

    async deleteOldFiles({ root }, lastDate) {
        let deleted = 0;
        for (const mainFolder of LocalStorage.MAIN_FOLDERS) {
            const mainPath = path.join(root, mainFolder);
            let employeeDirs;
            try {
                employeeDirs = await fs.readdir(mainPath, { withFileTypes: true });
            } catch (error) {
                if (error.code === 'ENOENT') continue; // nothing uploaded under this folder yet
                throw error;
            }

            for (const dirent of employeeDirs) {
                if (!dirent.isDirectory()) continue;
                const employeeDir = path.join(mainPath, dirent.name);
                const files = await fs.readdir(employeeDir);

                for (const file of files) {
                    const fileDate = this.fileDateFromName(file);
                    if (fileDate && fileDate.isBefore(lastDate, 'day')) {
                        await fs.unlink(path.join(employeeDir, file)).catch(() => {});
                        deleted += 1;
                    }
                }
            }
        }
        return deleted;
    }
}

module.exports = new LocalStorage();
