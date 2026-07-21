const axios = require('axios');
const ReportActivityLogModel = require('./../models/report-activity-log.schema');

const { logger: Logger } = require("../../../utils/Logger");

/**
 * getDomain
 * @description function to give domain details
 * @returns string
 */
function getDomain() {
    const {
        NODE_ENV: env,
        API_URL_LOCAL: localDomain,
        API_URL_DEV: devDomain,
        API_URL_PRODUCTION: prodDomain,
    } = process.env;

    switch (env) {
        case 'production':
            return `${prodDomain}/api/v3`;
        case 'development':
            return `${devDomain}/api/v3`;
        default:
            return `${localDomain}/api/v3`;
    }
}


/** ManualDeleteTempReportFiles
 * @param void
 * rturn void
 */
async function ManualDeleteTempReportFiles() {   
    try {
        console.log('--------cron called for Report Delete--------');
        Logger.info(`-----------Starting for report delete ${new Date()}----------------`)

        const fileDeleteAfterTime = getEnvTimeInMilli(process.env.REPORT_FILE_DELETE_AFTER_TIME || '24h');
        const notifyReportDeleteBeforeTime = getEnvTimeInMilli(process.env.REPORT_NOTIFY_BEFORE_DELETE_FILE_TIME || '1h')
        const deleteFileMap = new Map();

        /** read the temp dir request */
        const v3tempApi = getDomain() + '/temp'
        const { data: tempFileApiRes } = await axios.get(v3tempApi, {
            params: {
                type: 'files'
            }
        });
        const tempFileData = tempFileApiRes.data;

        //filename array
        const files = []; 
        for(let i = 0; i < tempFileData.length; i++) {
            files.push(tempFileData[i].filename);
        }

        /** function to notify before delete */
        notifyBeforeDelete(files, fileDeleteAfterTime, notifyReportDeleteBeforeTime);

        for (let filename of files) {
            const tempFileObj = tempFileData.find(fileObj => fileObj.filename == filename);
            const stat = tempFileObj.stat;
            const now = new Date().getTime();

            /** time after which file will be deleted */
            const fileLastChangeTime = new Date(stat.ctime).getTime() + fileDeleteAfterTime;
            if(now > fileLastChangeTime) {
                const doc =  await ReportActivityLogModel.findOneAndUpdate({ filename }, { stage:'manualDelete', is_active: false, is_deleted: true });

                if(!deleteFileMap.has(doc.user_id)) deleteFileMap.set(doc.user_id, []);

                let downloadLink = deleteFileMap.get(doc.user_id); 
                downloadLink.push(doc.download_link);
                deleteFileMap.set(doc.user_id, downloadLink);

                axios.get(v3tempApi, {
                    params: {
                        type: 'unlink',
                        filename: filename
                    }
                })
                .then(() => console.log(`${filename} deleted`))
                .catch(() => console.log('file not deleted'))
            }
        }

        /** function to notify after delete */
        notifyAfterDelete(deleteFileMap);
    } catch(err) {
        console.log("err ----", err);
    }
    finally {
        Logger.info(`-----------End for report delete ${new Date()}----------------`)
    }

}

/** 
 * notifyBeforDelete
 * @param Array files
 * @return void
 */
function notifyBeforeDelete(files, fileDeleteAfterTime, notifyReportDeleteBeforeTime) {
    /** to keep track of notification send userId */
    const userIdSet = new Set();
    const now = new Date().getTime();

    files.forEach(filename =>  {
        /** time left to delete the file */
        ReportActivityLogModel.findOne({ filename, is_active: true}).then(doc => {
            if(!doc) return;
            const fileCreatedAtDeleteTime = new Date(doc.createdAt).getTime() + fileDeleteAfterTime;
            const fileCreatedAtNotifyTime = new Date(doc.createdAt).getTime() + (fileDeleteAfterTime - notifyReportDeleteBeforeTime);   
            if( now >= fileCreatedAtNotifyTime && now < fileCreatedAtDeleteTime) {
                //send notifcation only once to a user
                if(userIdSet.has(doc.user_id)) return;
                userIdSet.add(doc.user_id);
                axios.get(`${ process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION }/api/v3/ws-notification`, {
                    params: {
                        type: 'newReportBeforeDelete',
                        message: `Files will be removed from the Storage within ${process.env.REPORT_NOTIFY_BEFORE_DELETE_FILE_TIME.match(/[h]/) ? process.env.REPORT_NOTIFY_BEFORE_DELETE_FILE_TIME.replace('h', " hours") : process.env.REPORT_NOTIFY_BEFORE_DELETE_FILE_TIME.replace(/[a-z]/," minutes")}`,
                        userId: doc.user_id
                    }
                })
                .then(response => console.log(response.data))
                .catch(error => console.log(error.message));
            }
        }).catch(err => console.log('err while fetching',err));
    });
}

/** 
 * notifyAfterDelete
 * @param Array files
 * @return void
 */
function notifyAfterDelete(deleteFileMap) {
    if(!deleteFileMap.size) return;

    for (let [userId, links] of deleteFileMap) {
        axios.get(`${ process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION }/api/v3/ws-notification`, {
            params: {
                type: 'newReportAfterDelete',
                message: 'The files got expired, if required please generate again.',
                userId,
                links
            }
        })
        .then(response => console.log("notify", response.data))
        .catch(error => console.log("notify", error.message)); 
    }
}


/** function to convet time into milliseconds */
function getEnvTimeInMilli(envTime) {
    let resultMiliTime = 1000;
    const [ time, unit] = envTime.split(/([hms])/);
    
    if (unit.toLowerCase() == 's') {
        return resultMiliTime * time;
    } 
    resultMiliTime *= 60;
    if (unit.toLowerCase() == 'm') {
        return resultMiliTime * time;
    }
    resultMiliTime *= 60;
    if (unit.toLowerCase() == 'h') {
        return resultMiliTime * time;
    }
    return resultMiliTime;
}

module.exports = {
    ManualDeleteTempReportFiles: ManualDeleteTempReportFiles
}
