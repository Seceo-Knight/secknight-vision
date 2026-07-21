const failedDataRestoreModel = require("./FailedDataRestore.model");
const crypt = require("../models/crypted");
const _ = require('underscore');
const axios = require('axios');

const restoreData = async (cb) => {

    let result = await failedDataRestoreModel.getAllData();
    if (result.length == 0) {
        await axios.get(`http://localhost:${process.env.PORT}/api/v3/disableFailedRestore`);
        return true;
    }
    let serverHealth = await failedDataRestoreModel.checkServerHealth();
    if (!serverHealth) { cb(); return true; }
    let chunkData = _.chunk(result, 150);
    for (let i = 1; i <= chunkData.length; i++) {
        setTimeout(async () => {
            await failedDataRestoreModel.restoreData(chunkData[i - 1]);
        }, 9000 * i);
    }

    cb();
}

module.exports = restoreData;