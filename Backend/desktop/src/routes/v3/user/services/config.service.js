'use strict'

const validator = require('./../user.validation');
const userModel = require('./../user.model');
const moment = require('moment');

const configFile = require('../../../../../../config/config');
const redisService = require('../../auth/services/redis.service');

class ConfigService {
    /*
        * get user system config
        *
        * @function configs
        * @param {*} req
        * @param {*} res
        * @param {*} next
        * @returns {object} -  setting object or null . 
    */
    async configs(req, res, next) {
        if (req.decoded && req.decoded.setting) {

            let orgId = req.decoded.organization_id;

            if(![6538].includes(orgId)) {
                if (configFile.AD_AUTO_UPDATE_ENABLE.includes(req.decoded.organization_id)) req.decoded.setting.system.autoUpdate = 1;
                else req.decoded.setting.system.autoUpdate = 0;
            }



            let { storage_setting, ...setting } = req.decoded.setting;
            req.decoded.settings = setting;

            let data = {
                ...req.decoded.setting,
                username: req?.decoded?.username,
                first_name: req?.decoded?.first_name,
                last_name: req?.decoded?.last_name,
                logout_feature: configFile.ENABLE_LOGOUT_FEATURE.includes(req.decoded.organization_id)
            }

            configFile.FILE_UPLOAD_SCREENSHOT_ALERT.includes(req.decoded.organization_id) ? data.file_upload_screenshot_alert = 1 : data.file_upload_screenshot_alert = 0;

            res.status(200).json({
                code: 200,
                error: null,
                message: 'User configs',
                data: data
            });
        }
        else
            res.status(404).json({
                code: 404,
                error: null,
                message: 'User configs not found',
                data: null
            });
    }
    /*
       * update userdetails which sent by agent.
       *
       * @function configs
       * @param {*} req
       * @param {*} res
       * @param {*} next
       * @returns {number} -  success or error . 
   */
    async systemInfo(req, res, next) {
        let { operating_system, architecture, software_version, service_version, computer_name, mac_id, geolocation } = await validator.validSystemInfoParams().validateAsync(req.body);
        operating_system = operating_system.trim();
        architecture = architecture.trim();
        software_version = software_version.trim();
        service_version = service_version.trim();
        computer_name = computer_name.trim();
        mac_id = mac_id.trim();
        let hasLocationChanged = false;

        const { employee_id, user_id } = req.decoded;

        const systemInfo = {
            operating_system,
            architecture,
            software_version,
            service_version,
            computer_name,
            mac_id,
        };

        const redisKey = `${employee_id}_system_info`;
        const cachedDataStr = await redisService.getAsync(redisKey);

        if (cachedDataStr) {
            const cachedData = JSON.parse(cachedDataStr);
            const cachedGeolocation = cachedData.geolocation;
            delete cachedData.geolocation;

            const isSystemInfoSame = areObjectsEqual(cachedData, systemInfo);
            hasLocationChanged = shouldUpdateLocation(
                cachedGeolocation?.latitude,
                cachedGeolocation?.longitude,
                geolocation?.latitude,
                geolocation?.longitude
            );

            if (isSystemInfoSame && !hasLocationChanged) {
                return res.status(200).json({
                    code: 200,
                    error: null,
                    message: 'User system info is already the latest',
                    data: null,
                });
            }
        }

        // If no cache or changes found, update Redis
        systemInfo.geolocation = geolocation;
        await redisService.setAsync(redisKey, JSON.stringify(systemInfo), 'EX', 60 * 60 * 24 * 5); // Cache for 5 days

        try {
            const [userData] = await userModel.getUser({ userId: user_id });
            if (!userData.username && mac_id && computer_name) {
                await userModel.updateUserDetails({ computerName: computer_name, userId: user_id, macId: mac_id });
            }
            let [employeeDetails] = await userModel.findGeoLocationDetails(employee_id);
            let tempAgentInfo;
            if (employeeDetails.software_version != software_version) {
                if (employeeDetails.agent_info === null) {
                    tempAgentInfo = {
                        initialUpdatePeriod: moment().format('YYYY-MM-DD HH:mm:ss'),
                        updatedPeriod: moment().format('YYYY-MM-DD HH:mm:ss'),
                    }
                }
                else {
                    employeeDetails.agent_info = JSON.parse(employeeDetails.agent_info)
                    tempAgentInfo = {
                        initialUpdatePeriod: employeeDetails.agent_info.initialUpdatePeriod,
                        updatedPeriod: moment().format('YYYY-MM-DD HH:mm:ss'),
                    }
                }
            }
            if(hasLocationChanged && configFile.GEO_LOCATION_CHANGE_LOGGING.includes(req.decoded.organization_id) && geolocation && geolocation.latitude !== 0 && geolocation.longitude !== 0) {
                await userModel.logGeoLocationChange({
                    employee_id,
                    organization_id: req.decoded.organization_id,
                    latitude: geolocation.latitude,
                    longitude: geolocation.longitude,
                    time: Date.now(),
                });
            }
            let updatedData = await userModel.updateUserSystemInfo(employee_id, operating_system, architecture, software_version, service_version, geolocation, tempAgentInfo);
            if (updatedData.changedRows === 1) {
                res.status(200).json({
                    code: 200,
                    error: null,
                    message: 'User system info',
                    data: updatedData.changedRows
                });
                await userModel.updateUserDetails({ computerName: computer_name, userId: user_id, macId: mac_id });
            } else return res.status(200).json({
                code: 200,
                error: null,
                message: 'User system info is already the latest',
                data: null
            });
        } catch (error) {
            return res.status(422).json({
                code: 422,
                error: 'Error',
                message: error.message,
                data: null
            });
        }
    }
}

module.exports = new ConfigService;


function areObjectsEqual(obj1, obj2) {
    if (!obj1 || !obj2) return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
}


const RADIUS_THRESHOLD_METERS = 10;
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg) => deg * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}


function shouldUpdateLocation(oldLat, oldLon, newLat, newLon) {
    const distance = getDistanceInMeters(oldLat, oldLon, newLat, newLon);
    return distance >= RADIUS_THRESHOLD_METERS;
}
