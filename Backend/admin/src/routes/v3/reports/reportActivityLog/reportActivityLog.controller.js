const ReportActivityLogModel = require("./reportActivityLog.model");
const fs = require("fs");

class ReportActivityLogController {
    async getActivityLogs(req, res, next) {

        let { user_id, organization_id } = req.decoded;
        const downloadReportActivity = await ReportActivityLogModel.getActivityLogs({ user_id, organization_id, is_active: true, stage: ['generating', 'done'] });
        
        let finalData = [];
        for (const item of downloadReportActivity) {
            if (fs.existsSync(item?.file_path)) {
                finalData.push(item);
            }
            else {
                // if file now found then update in mongo db
                await ReportActivityLogModel.updateReportActivity({ _id: item._id}, {is_active: false});
            }
        }

        return res.json({ code: 200, data: finalData, message: 'Report Activity Log', error: null });

    }
}

module.exports = new ReportActivityLogController;
