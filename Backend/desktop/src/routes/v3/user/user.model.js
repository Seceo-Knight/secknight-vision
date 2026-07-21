'use strict';

const mySql = require('../../../database/MySqlConnection').getInstance();
const GeoLocationChangeLogModel = require('../../../models/geo_location_change_logs.schema');


class ConfigModel {
    constructor() {
        this.employeeTable = 'employees';
        this.usersTable = 'users';
    }

    updateUserSystemInfo(employee_id, operating_system, architecture, software_version, service_version, geoLocation, tempAgentInfo) {
        let query, paramsArray;
        if (geoLocation) {
            if (geoLocation.latitude == 0 && geoLocation.longitude == 0) {
                geoLocation = null;
            } else {
                geoLocation = JSON.stringify(geoLocation)
            }
            if(tempAgentInfo){
                query = `UPDATE ${this.employeeTable} SET operating_system = ?, architecture = ?, software_version = ?,service_version= ?, agent_info= '${JSON.stringify(tempAgentInfo)}' WHERE id = ?`;
                paramsArray = [operating_system, architecture, software_version, service_version, employee_id];
            }
            else {
                query = `UPDATE ${this.employeeTable} SET operating_system = ?, architecture = ?, software_version = ?,service_version= ?,geolocation=?  WHERE id = ?`;
                paramsArray = [operating_system, architecture, software_version, service_version, geoLocation, employee_id];
            }
        } else if (tempAgentInfo) {
            query = `UPDATE ${this.employeeTable} SET operating_system = ?, architecture = ?, software_version = ?,service_version= ?, agent_info= '${JSON.stringify(tempAgentInfo)}' WHERE id = ?`;
            paramsArray = [operating_system, architecture, software_version, service_version, employee_id];
        }
        else {
            query = `UPDATE ${this.employeeTable} SET operating_system = ?, architecture = ?, software_version = ?,service_version= ? WHERE id = ?`;
            paramsArray = [operating_system, architecture, software_version, service_version, employee_id];
        }
        return mySql.query(query, paramsArray);
    }

    getUser({ userId }) {
        const query = `SELECT * FROM ${this.usersTable} WHERE id=?`;

        return mySql.query(query, [userId]);
    }

    updateUserDetails({ computerName, userId, macId }) {
        const query = `UPDATE ${this.usersTable} SET computer_name = ?,mac_id = ? WHERE id = ?`;
        const paramsArray = [computerName, macId, userId];


        return mySql.query(query, paramsArray);
    }

    findGeoLocationDetails (employee_id) {
        const query = `
            SELECT e.software_version, e.agent_info
            FROM employees e
            WHERE id = ${employee_id}
        `;
        return mySql.query(query);
    }

    getAdminId(organization_id) {
        const query = `
            SELECT u.id
            FROM users u
            JOIN organizations o ON o.user_id = u.id
            WHERE o.id = ?
        `;
        return mySql.query(query, [organization_id]);
    }

    logGeoLocationChange({ employee_id, organization_id, latitude, longitude, time }) {
        return new GeoLocationChangeLogModel({
            employee_id,
            organization_id,
            latitude,
            longitude,
            time
        }).save();
    }

    storageDetails(organizationId) {
        let query = `SELECT opc.creds, p.short_code FROM organization_providers op
            JOIN providers p ON p.id = op.provider_id
            JOIN organization_provider_credentials opc ON op.id = opc.org_provider_id
            WHERE op.organization_id = ? AND opc.status =1
        `;
        return mySql.query(query, [organizationId]);
    }
}

module.exports = new ConfigModel;