const _ = require('underscore');
const LocationModel = require('./location.model');
const OrganizationLocationModel = require('../../location/location.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const joiValidation = require('./location.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { locationMessages } = require("../../../../utils/helpers/LanguageTranslate");
const axios = require('axios');

class LocationController {

    /**
* Create location
*
* @function createLocation
* @memberof  LocationController
* @param {*} req
* @param {*} res
* @returns {object} created list or error
*/
    async createLocation(req, res) {
        const { organization_id, language, timezone = "Africa/Abidjan" } = req.decoded;
        try {
            let { value, error } = joiValidation.addNewLocation(req.body);
            if (error) return sendResponse(res, 404, null, translate(locationMessages, "2", language), error.details[0].message);

            let { location, location_head_id, location_hr_id, email, phone, fax, address_one, address_two, city, state, country, zip } = value;
            const locationCheck = await OrganizationLocationModel.checkLocationName(location, organization_id);
            if (locationCheck.length > 0) return sendResponse(res, 400, null, translate(locationMessages, "4", language), null);

            let details = JSON.stringify({ email, phone, fax, address_one, address_two, city, state, country, zip });
            const locations = await LocationModel.addLocation(location, timezone, location_head_id, location_hr_id, details, organization_id);
            if (!locations) return sendResponse(res, 400, null, translate(locationMessages, "8", language), null);

            if (locations.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    location: {
                        location_id: locations.insertId || null,
                        location_name: location || null,
                        location_details: details,
                        timezone: timezone || null,
                    },
                }, translate(locationMessages, "7", language), null);
            }
            return sendResponse(res, 400, null, translate(locationMessages, "8", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(locationMessages, "9", language), err);
        }
    }

    async getGeoFieldData(req, res) {
        try {
            const { organization_id , language} = req.decoded;
            let data = req?.body;
            const body = { 
                orgId: organization_id,
                locationName: data.locationName, 
            };
            let attendance = await axios.post(process.env.FIELD_API_URL + 'hrmsAdmin/get-location-details', body);
            if (attendance.data.body.status == "success"){
                return sendResponse(res, 200, attendance.data.body.data, translate(locationMessages, "29", language), null)
            }
            else{
                return sendResponse(res, 400, null, translate(locationMessages, "18", language), null)
            }
        } 
        catch (err) {
            return sendResponse(res, 400, null, translate(locationMessages, "9", language), err);
        }
    }

    /**
* Get location
*
* @function getLocations
* @memberof  LocationController
* @param {*} req
* @param {*} res
* @returns {object} requested list or error
*/
    async getLocations(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = joiValidation.getLocation(req.query);
            if (error) return sendResponse(res, 404, null, translate(locationMessages, "2", language), error.details[0].message);

            const { location_id } = value;
            let locations = await LocationModel.getLocations(location_id, organization_id);
            if (locations.length == 0) return sendResponse(res, 400, locations, translate(locationMessages, "18", language), null);

            let hrIds = _.pluck(locations, "location_hr_id");
            hrIds = _.unique(hrIds);
            hrIds = hrIds.filter(el => el != null);
            let hrData = [];
            if (hrIds.length > 0) hrData = await LocationModel.getUsers(hrIds);

            locations = locations.map(item => ({
                ...item,
                hrName: hrData.find(itr => itr.id === item.location_hr_id) ? hrData.find(itr => itr.id === item.location_hr_id).name : null,
                details: (item.details != null) ? JSON.parse(item.details) : null,
            }))
            if (locations.length > 0) return sendResponse(res, 200, locations, translate(locationMessages, "29", language), null);

            return sendResponse(res, 400, null, translate(locationMessages, "18", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(locationMessages, "27", language), null);
        }
    }

    /**
* Update location
*
* @function updateLocation
* @memberof  LocationController
* @param {*} req
* @param {*} res
* @returns {object} updated list or error
*/
    async updateLocation(req, res) {
        const { organization_id, language, timezone = "Africa/Abidjan" } = req.decoded;
        try {
            let { value, error } = joiValidation.updateLocation(req.body);
            if (error) return sendResponse(res, 404, null, translate(locationMessages, "2", language), error.details[0].message);

            let { location_id, location, timezone, location_head_id, location_hr_id, email, phone, fax, address_one, address_two, city, state, country, zip } = value;
            const locationId = await OrganizationLocationModel.getLocationById(location_id, organization_id);
            if (locationId.length == 0) return sendResponse(res, 400, null, translate(locationMessages, "18", language), null);

            const locationCheck = await OrganizationLocationModel.checkLocationName(location, organization_id);
            if ((locationCheck.length > 0) && (locationCheck[0].id != location_id)) return sendResponse(res, 400, null, translate(locationMessages, "4", language), null);

            let details = JSON.stringify({ email, phone, fax, address_one, address_two, city, state, country, zip });
            const locations = await LocationModel.updateLocation(location, timezone, location_head_id, location_hr_id, details, location_id, organization_id);
            if (!locations) return sendResponse(res, 400, null, translate(locationMessages, "8", language), null);

            if (locations.affectedRows !== 0) {
                return sendResponse(res, 200, {
                    location: {
                        location_id: location_id || null,
                        location_name: location || null,
                        location_details: details,
                        timezone: timezone || null,
                    },
                }, translate(locationMessages, "11", language), null);
            }
            return sendResponse(res, 400, null, translate(locationMessages, "8", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(locationMessages, "9", language), err);
        }
    }

    /**
* Delete location
*
* @function deleteLocation
* @memberof  LocationController
* @param {*} req
* @param {*} res
* @returns {object} deleted list or error
*/
    async deleteLocation(req, res) {
        let { organization_id, language } = req.decoded;
        let { location_id } = req.body.location_id;
        try {
            const location = await OrganizationLocationModel.getLocationById(location_id, organization_id);
            if (location.length > 0) {
                const locationDetails = await OrganizationLocationModel.deleteLocation(location_id, organization_id);
                if (locationDetails.affectedRows !== 0) {
                    return sendResponse(res, 200, [], translate(locationMessages, "15", language), null);
                }
            }
            return sendResponse(res, 400, null, translate(locationMessages, "18", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(locationMessages, "17", language), null);
        }
    }
}

module.exports = new LocationController;