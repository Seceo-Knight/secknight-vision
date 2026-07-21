export const mainFolderNames = {
    screenshots: 'EmpMonitor',
    screenRecords: 'EmpMonitorRecords',
}

export const localyFolders = {
    screenshots: 'screenshots',
    records: 'records'
}

export const providerCodes = {
    googleDrive: 'GD',
    amazonS3: 'S3',
    FTP: 'FTP',
    SFTP: 'SFTP',
    zohoWorkDrive: 'ZH',
    OneDrive: 'MO',
    Dropbox: 'DB',
    webdav: 'WD',
}

export const videoConditions = {
    maxDuration: 300, // in seconds
    maxSize: 15_000_000, // in bytes
    maxWidth: 640,
    maxHeigth: 480,
    format: 'mp4',
    codec: 'libx264',
    bitrate: '512k',
    mimetype: 'video/mp4'
}
export const imageConditions = {
    maxSize: 2_000_000, // in bytes
}