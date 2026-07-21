const failed_activity_data = require("../models/failed_activity_data.schema");

const axios = require('axios');

const redis = require("../../../database/redisConnection");

class FailedDataRestoreModel {

    async getAllData() {
        return await failed_activity_data.find({}).skip(0).limit(900);
    }

    async restoreData(data) {
        try {
            let dbDataCount = await failed_activity_data.countDocuments();
            let response = await axios.post(`${process.env.ACTIVITY_PRODUCTIVITY_URL}api/v1/reports/activity2`, { data });
            
            let failedDataRTCount = await redis.getAsync("failedDataTry") || 0;

            if (response.data.data.filter(x => x.status == "rejected").length == dbDataCount) {    
                await redis.setAsync("failedDataTry", ++failedDataRTCount);
            }

            if (data.length < 100 && (failedDataRTCount  == 2|| dbDataCount == 0) ) {
                await axios.get(`http://localhost:${process.env.PORT}/api/v3/disableFailedRestore`);
                await failed_activity_data.deleteMany();
            }
            return true;
        } catch (error) {
            return false;
        }
    }
    async checkServerHealth() {
        try {
            let response = await axios.post(`${process.env.ACTIVITY_PRODUCTIVITY_URL}api/v1/reports/checkServerHealth`);
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = new FailedDataRestoreModel;