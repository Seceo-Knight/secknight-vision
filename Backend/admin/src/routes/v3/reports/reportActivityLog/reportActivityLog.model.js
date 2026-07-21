const ReportActivityLogModel = require('./../../../../models/report-activity-log.schema');

module.exports = {
    getActivityLogs: async function({ user_id, organization_id, is_active, stage}) {
        const data = await ReportActivityLogModel.find({user_id, organization_id, stage:{$in: stage}, is_active }, {_id: 1, file_size: 1, download_link:1, stage: 1, file_path: 1});
        return data;
    },
    addReportActivity: async function({ 
        type,
        user_id,
        filename,
        file_path,
        stage,
        download_link,
        organization_id
    }) {
        return await ReportActivityLogModel.create({ type, user_id, filename, file_path, stage, download_link, organization_id });
    },
    updateReportActivity: async function(updateQuery, updateBody) {
        return await ReportActivityLogModel.findOneAndUpdate(updateQuery, updateBody);  
    },
    getPendingReportDownloadCount: async function ({user_id, organization_id, typeArr}) {
        return await ReportActivityLogModel.find({ user_id, organization_id, stage: { $in: ['new', 'generating', 'done'] }, type: { $in: typeArr }, is_active: true }).countDocuments();
    }
}