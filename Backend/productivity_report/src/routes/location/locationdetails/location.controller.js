const LocationModel = require('./location.model');
const sendResponse = require('../../../utils/myService').sendResponse;

class LocationController {
    async getLocationWithDepartment(req, res) {
        const admin_id = req['decoded'].jsonData.admin_id;
        try {
            let locations = await LocationModel.getLocations(admin_id);
            for (const location of locations) {
                let dept = await LocationModel.getlocationToDepartment(location.location_id);
                location.department = dept;
            }
            return sendResponse(res, 200, locations, 'Location data.', null);
        } catch (err) {
            console.log('=======', err);
            return sendResponse(res, 400, null, 'Failed to get locations', err);
        }
    }

    // async getDepartment(req, res) {
    //     const admin_id = req['decoded'].jsonData.admin_id;
    //     try {

    //     } catch (err) {
    //         return sendResponse(res, 400, null, 'Failed to get departments', err);
    //     }
    // }
}

module.exports = new LocationController;