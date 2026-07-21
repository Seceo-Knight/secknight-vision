const GeoLocationSchema = require('../../../../models/mobile_geolocation.schema');
const mySql = require('../../../../database/MySqlConnection').getInstance();
const { TaskSchemaModel } = require('../../../../models/silah_db.schema');

class GeoLocationModel {
    checkSameDateDataExist(employee_id, organization_id, date) {
        return GeoLocationSchema.findOne({
            employee_id,
            organization_id,
            yyyymmdd: +date.split('-').join(''),
        })
    }

    addGeoLocationLogs({ employee_id, organization_id, date, longitude, latitude, city, address, timestamp }) {
        return new GeoLocationSchema({
            employee_id: employee_id,
            organization_id: organization_id,
            date: date,
            yyyymmdd: +date.split('-').join(''),
            geoLogs: [{
                time: timestamp,
                latitude: latitude,
                longitude: longitude,
                city: city,
                address: address,
            }]
        }).save();
    }

    async fetchUserLocationDetails({ latitude, longitude }) {
        const axios = require('axios');
        // const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAP_API_KEY_SILAH}`;
        let response = await axios.get(url);
        if (response.data.results.length > 0) {
            const result = response.data.results[0];
            const formattedAddress = result.formatted_address;
            let postalCode = '';
            let city = '';
            let country = '';

            // Extracting postal code, city, and country
            result.address_components.forEach(component => {
                if (component.types.includes('postal_code')) {
                    postalCode = component.long_name;
                } else if (component.types.includes('locality')) {
                    city = component.long_name;
                } else if (component.types.includes('country')) {
                    country = component.long_name;
                }
            });

            return {
                formattedAddress,
                postalCode,
                city,
                country,
                status: true
            };
        } else {
            return {
                status: false,
                messages: 'No results found'
            };
        }
    }

    fetchGeoLocation(employee_id, organization_id, start_date, end_date) {
        let match = {
            organization_id,
            yyyymmdd: { $gte: +start_date.split('-').join(''), $lte: +end_date.split('-').join('') }
        }
        if (employee_id) match.employee_id = employee_id;
        return GeoLocationSchema.aggregate([
            {
                $match: match
            },
            { "$sort": { "createdAt": -1 } },
            {
                $project: {
                    _id: 0,
                    employee_id: 1,
                    date: 1,
                    yyyymmdd: 1,
                    geoLogs: 1
                }
            }
        ])
    }

    getEmployeeDetail(employee_ids, organization_id) {
        let query = `
            SELECT u.first_name AS first_name, u.last_name AS last_name, u.email, u.a_email, e.id as employee_id, e.organization_id, e.timezone, JSON_EXTRACT(e.custom_tracking_rule, '$.isSilahMobileGeoLocation') as status
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.id IN (${employee_ids}) AND e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }

    getTotalTaskTime(start_time, end_time, employee_id) {
        return TaskSchemaModel.aggregate([
            {
                $match: {
                    "$or": [
                        {
                            "task_working_status.start_time": { $gte: new Date(start_time), $lte: new Date(end_time) }
                        },
                        {
                            "task_working_status.end_time": { $gte: new Date(start_time), $lte: new Date(end_time) }
                        }
                    ],
                    assigned_user: employee_id,
                    status: { $ne: 0}
                }
            }
        ])
    }

    getAllEmployees(organization_id, status, assigned_employees) {
        let query = `
            SELECT e.id, u.first_name, u.last_name, JSON_EXTRACT(e.custom_tracking_rule, '$.isSilahMobileGeoLocation') as status
                FROM employees e
                JOIN organizations o ON o.id = e.organization_id 
                JOIN users u ON u.id = e.user_id 
                WHERE e.organization_id = ${organization_id}
        `;
        if(status == 0) query += ` AND (JSON_EXTRACT(e.custom_tracking_rule, '$.isSilahMobileGeoLocation') = 0 OR JSON_EXTRACT(e.custom_tracking_rule, '$.isSilahMobileGeoLocation')  IS NULL)`;
        else query += ` AND JSON_EXTRACT(e.custom_tracking_rule, '$.isSilahMobileGeoLocation') = 1`;

        if(assigned_employees.length) query += ` AND e.id IN (${assigned_employees})`;
        return mySql.query(query);
    }

    getEmployeesGeoLogStatus(employee_id, organization_id) {
        let query = `
            SELECT e.id, u.first_name, u.last_name, JSON_EXTRACT(e.custom_tracking_rule, '$.isSilahMobileGeoLocation') as status, JSON_EXTRACT(e.custom_tracking_rule, '$.silahMobileGeoLocationFrequency') as frequency 
                FROM employees e
                JOIN organizations o ON o.id = e.organization_id 
                JOIN users u ON u.id = e.user_id 
                WHERE e.organization_id = ${organization_id} AND e.id = ${employee_id}
        `;
        return mySql.query(query);
    }

    getAssignedEmployees(employee_id, organization_id) {
        let query = `
            SELECT e.id
                FROM employees e 
                JOIN assigned_employees ae ON ae.employee_id = e.id
                WHERE ae.to_assigned_id = ${employee_id} AND e.organization_id = ${organization_id}
        `;
        return mySql.query(query);
    }
}

module.exports = new GeoLocationModel();