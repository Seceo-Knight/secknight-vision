const fs = require('fs');
const path = require('path');

/**
 * @class
 */
class TempFileService {
    constructor() {
        this.fsPath = __dirname.split('src')[0] + 'public/temp/' // temp folder
    }
    /**
     * getFileDetails
     * @description function to get file desc from temp folder
     * @returns 
     */
    async getFileDetails() {
        const resultArr = [];
        try {
            const files = fs.readdirSync(this.fsPath);
            for (let filename of files) {
                const filePath = path.join(this.fsPath, filename);
                const stat = fs.statSync(filePath);
                resultArr.push({
                    filename,
                    stat
                });
            }
            return resultArr;
        } catch (err) {
            return resultArr;
        }
    }

    /**
     * unlinkFile
     * @description function to unlink the file
     * 
     * @param {*} filename 
     * @returns 
     */
    async unlinkFile(filename) {
        try {
            const filePath = path.join(this.fsPath, filename);
            // file unlink
            fs.unlinkSync(filePath);
            return true;
        } catch (err) {
            if(err) console.log('file not deleted');
            return false;
        }
    }
}

module.exports = new TempFileService();