const TempFileService = require("./tempFile.service");

/**
 * @class
 */
class TempFileController {
    /**
     * tempFileAction 
     * @description function to take temp file action
     * 
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     * @returns 
     */
    async tempFileAction(req, res, next) {
        const tempFileQuery = req.query;
        
        /** send files details */
        if(tempFileQuery.type == 'files') {
            const fileDetailsData = await TempFileService.getFileDetails();
            return res.json({code: 200, message: 'done', data: fileDetailsData});
        }

        /** send unlink details */
        if(tempFileQuery.type == 'unlink') {
            const unlinkDetails = await TempFileService.unlinkFile(tempFileQuery.filename);
            if(!unlinkDetails) {
                return res.json({code: 404, message: 'error'});
            }
            return res.json({code: 200, message: 'unlinked'});
        } 

        return res.json({code: 200, message: 'success message'});
    }
}

module.exports = new TempFileController();