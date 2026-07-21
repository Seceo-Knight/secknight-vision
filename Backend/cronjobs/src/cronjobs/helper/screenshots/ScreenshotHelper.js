const fs = require('fs');
const moment = require('moment');
const async = require('async');

module.exports = {
    RemoveOldFile: (callback) => {
        let testFolder = __dirname.split('cronjobs')[0] + '/admin/public/screenshots';
        fs.readdir(testFolder, (err, files) => {
            if (err) {
                callback();
            } else if (files.length > 0) {
                async.forEach(files, (file, cb) => {
                    const stats = fs.statSync(`${testFolder}/${file}`);
                    const previous_time = moment().utc().subtract(process.env.SCREENSHOTS_DEL, "hours").format('YYYY-MM-DD HH:mm:ss');
                    const current_time = moment().utc().format('YYYY-MM-DD HH:mm:ss');
                    const file_time = moment(stats.birthtime).utc().format('YYYY-MM-DD HH:mm:ss');

                    if (!moment(file_time).isBetween(previous_time, current_time, null, '[]')) {
                        fs.unlinkSync(`${testFolder}/${file}`);
                        console.log('========need to delete==========');
                        cb();
                    } else {
                        console.log('======no need to delete==========');
                        cb();
                    }
                }, () => {
                    console.log('========Checked All File========');
                    callback();
                });
            } else {
                console.log('========Folder Not Found======');
                callback();
            }
        });

    }
}