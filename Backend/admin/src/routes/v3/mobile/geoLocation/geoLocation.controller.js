const Validation = require('./geoLocation.validation');
const Model = require('./geoLocation.model');
const moment = require('moment-timezone');
const _ = require('underscore');

const translate = require('../utils/translation');

class GeoLocationController {
    async addGeoLocationLogs(req, res, next) {
        try {
            let timestamp = moment().utc().toISOString();
            let { employee_id, timezone, organization_id, language } = req.decoded;
            let [dataStatus] = await Model.getEmployeesGeoLogStatus(employee_id, organization_id);
            if(!dataStatus) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 7)[language || 'en'], error: null, data: null});
            if (dataStatus.status != 1) return res.status(200).json({ code: 200, message: translate.find(i => i.id == 33)[language || 'en'], data: null, error: null });
            let { longitude, latitude } = await Validation.validateGeoLogsData().validateAsync(req.body);
            
            let date = moment().tz(timezone).format('YYYY-MM-DD');

            let data = await Model.checkSameDateDataExist(employee_id, organization_id, date);
            if(data) {
                if(!radialDistance(data.geoLogs[data.geoLogs.length - 1].latitude, data.geoLogs[data.geoLogs.length - 1].longitude, latitude, longitude)) {
                    let locationResponse = await Model.fetchUserLocationDetails({ longitude, latitude });
                    let { formattedAddress, postalCode, city, country, status } = locationResponse;
                    if(!status) throw new Error('Location not found');
                    data.geoLogs.push({
                        time: timestamp,
                        latitude: latitude,
                        longitude: longitude,
                        city: city,
                        address: formattedAddress,
                    })
                    await data.save();
                }
            }
            else {
                let locationResponse = await Model.fetchUserLocationDetails({ longitude, latitude });
                let { formattedAddress, postalCode, city, country, status } = locationResponse;
                if(status) data = await Model.addGeoLocationLogs({employee_id, organization_id, date, longitude, latitude, city: city, address: formattedAddress, timestamp});
                else throw new Error('Location not found');
            }

            return res.status(200).json({ code: 200, message: translate.find(i => i.id == 33)[language || 'en'], data: null, error: null });
        } catch (error) {
            next(error);
        }
    }

    async fetchGeoLogStatus(req, res, next) {
        try {
            let { organization_id, employee_id, language } = req.decoded;
            let [data] = await Model.getEmployeesGeoLogStatus(employee_id, organization_id);
            if(!data) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 7)[language || 'en'], error: null, data: null});
            return res.status(200).json({ code: 200, data: data, error: null, message: translate.find(i => i.id == 1)[language || 'en'] });
        }
        catch(error) {
            return next(error);
        }
    }

    async fetchGeoLocation(req, res, next) {
        try {
            let { organization_id, language } = req.decoded;

            let { employee_id, start_date, end_date } = await Validation.validateFetchGeoLocation().validateAsync(req.body);
            start_date = moment(start_date).format('YYYY-MM-DD');
            end_date = moment(end_date).format('YYYY-MM-DD');
            let [employeeDetail] = await Model.getEmployeeDetail(employee_id, organization_id);
            if(!employeeDetail) return res.status(404).json({ code: 404, message: translate.find(i => i.id == 7)[language || 'en'], error: null, data: null});
            let data = await Model.fetchGeoLocation(employee_id, organization_id, start_date, end_date);

            let finalResult = [];
            for (const item of data) {
                finalResult = [...item.geoLogs, ...finalResult];
            }
            let dates = finalResult.map(item => moment(item.time));
            return res.status(200).json({ 
                code: 200, 
                message: translate.find(i => i.id == 34)[language || 'en'], 
                data: {
                    geoLog: finalResult, 
                    timezone: employeeDetail.timezone,
                    status: employeeDetail.status,
                    start_time: data.length ? moment.max(dates) : null,
                    end_date: data.length ? moment.min(dates) : null
                }, 
                error: null 
            });
        }
        catch (error) {
            next(error);
        }
    }

    async getTotalTaskTime(req, res, next) {
        try {
            let { language } = req.decoded;
            let { employee_id, start_date, end_date } = await Validation.validateFetchGeoLocation().validateAsync(req.body);
            start_date = moment(start_date);
            end_date = moment(end_date).add(1, 'days');

            let data = await Model.getTotalTaskTime(start_date, end_date, employee_id);
            let taskDataS = [];
            for (const { task_working_status } of data) {
                taskDataS = [...task_working_status, ...taskDataS];
            }

            let totalWorkedTime = 0;

            for (const taskData of taskDataS) {
                if(moment(taskData.start_time).isBetween(start_date, end_date) && moment(taskData.end_time).isBetween(start_date, end_date)) {
                    totalWorkedTime += moment(taskData.end_time).diff(moment(taskData.start_time), 'seconds');
                }
            }
        
            return res.status(200).json({ code: 200, message: translate.find(i => i.id == 35)[language || 'en'], data: totalWorkedTime, error: null });
        }
        catch (error) {
            next(error);
        }
    }

    async getAllEmployees(req, res, next) {
        try {
            let { organization_id, employee_id, language } = req.decoded;
            let status = req.query.status || 1;
            let assigned_employees = [];
            if(employee_id) {
                // Get all assigned employees
                let assignedEmployees = await Model.getAssignedEmployees(employee_id, organization_id);
                if(assignedEmployees.length) {
                    assigned_employees = _.pluck(assignedEmployees, 'id');
                }
            }
            if(['0', 0, '1', 1].includes(status)){
                let employeeData = await Model.getAllEmployees(organization_id, status, assigned_employees);
                return res.status(200).json({ code: 200, message: translate.find(i => i.id == 36)[language || 'en'], data: employeeData, error: null });
            } 
            else {
                let employeeDataEnable = await Model.getAllEmployees(organization_id, 1, assigned_employees);
                let employeeDataDisable = await Model.getAllEmployees(organization_id, 0, assigned_employees);
                return res.status(200).json({ code: 200, message: translate.find(i => i.id == 36)[language || 'en'], data: [...employeeDataEnable, ...employeeDataDisable], error: null });
            }
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new GeoLocationController();



const radialDistance = (lat1, lon1, lat2, lon2)  => {  
    const R = 6371e3; // Radius of the Earth in meters  
    const φ1 = lat1 * Math.PI/180; // Convert latitude to radians  
    const φ2 = lat2 * Math.PI/180;  
    const Δφ = (lat2-lat1) * Math.PI/180;  
    const Δλ = (lon2-lon1) * Math.PI/180;  

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +  
          Math.cos(φ1) * Math.cos(φ2) *  
          Math.sin(Δλ/2) * Math.sin(Δλ/2);  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));  

    const d = R * c; // Calculate the distance in meters  

    if (d <= 10) {  
        return true; // If distance is less than or equal to 10 meters, return true  
    } else {  
        return false; // If distance is greater than 10 meters, return false  
    }  
}  