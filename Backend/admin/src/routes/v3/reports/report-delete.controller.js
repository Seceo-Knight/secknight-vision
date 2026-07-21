const fs = require('fs');
const path = require('path');
const ReportActivityLogModel = require("./reportActivityLog/reportActivityLog.model");

class ReportDeleteController {
    
    /**
     * function to delete the file after they are download using link
     *
     * @function deleteFileAfterDownload
     * @memberof ReportDeleteController
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @returns
     */
    deleteFileAfterDownload (req,res, next) {
        let reqUrl = decodeURI(req.url);
        let filename = reqUrl.substring(reqUrl.lastIndexOf('/') + 1);
        const fileExt = filename.substring(filename.lastIndexOf('.') + 1);
        /** file ext to delete after donwload */
        if( fileExt.toLowerCase() == 'csv' || fileExt.toLowerCase() == 'xlsx') {
            const fileDist = __dirname.split('src')[0] + 'public/temp/'
            let filePath = path.join(fileDist, `${filename}`);
            
            /** file not present call next */
            if (!fs.existsSync(filePath)) next();
            
            res.download(filePath, filename, function(err){
                fs.unlink(filePath, (err) => {
                    ReportActivityLogModel.updateReportActivity({ filename }, { is_downloaded:true });
                    if(!err)  ReportActivityLogModel.updateReportActivity({ filename }, { stage:'downloaded', is_active: false, is_deleted: true });
                    next();
                });
            });
        } else {
            next()
        }
    }
}

module.exports = new ReportDeleteController;