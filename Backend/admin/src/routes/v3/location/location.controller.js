const LocationModel = require('./location.model');
const sendResponse = require('../../../utils/myService').sendResponse;
const joiValidation = require('./location.validation');
const actionsTracker = require('../services/actionsTracker');
const { locationMessages, genericErrorMessage } = require("../../../utils/helpers/LanguageTranslate");
const { translate } = require('../../../utils/messageTranslation');

const configFile = require('../../../../../config/config');

class LocationController {
    async getLocationWithDepartment(req, res) {
        actionsTracker(req, 'Locations with department requested.');

        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        try {
            if((req.decoded.is_manager || req.decoded.is_teamlead) && configFile?.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN?.split(',')?.includes(`${organization_id}`)) {
                const [locations, orgSett] = await Promise.all([
                    LocationModel.getLocationBasedOnNonAdmin(req.decoded.employee_id),
                    LocationModel.orgSetting(organization_id)
                ]);
                for (const location of locations) {
                    let dept = await LocationModel.getlocationToDepartmentOnNonAdmin(location.id, req.decoded.employee_id);
                    location.location_id = location.id;
                    location.location = location.name;
                    location.department = dept;
                    delete location.id;
                    delete location.name;
                }
                return res.json({ code: 200, data: locations, orgtimezone: orgSett[0].timezone, message: locationMessages.find(x => x.id === "1")[language] || locationMessages.find(x => x.id === "1")["en"], error: null });
            }

            const [locations, orgSett] = await Promise.all([
                LocationModel.getLocations(organization_id),
                LocationModel.orgSetting(organization_id)
            ]);
            for (const location of locations) {
                let dept = await LocationModel.getlocationToDepartment(location.location_id);
                location.department = dept;
            }
            return res.json({ code: 200, data: locations, orgtimezone: orgSett[0].timezone, message: locationMessages.find(x => x.id === "1")[language] || locationMessages.find(x => x.id === "1")["en"], error: null });
        } catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "3")[language] || locationMessages.find(x => x.id === "3")["en"], err);
        }
    }

    async addLocation(req, res) {
        const organization_id = req.decoded.organization_id;
        let location = req.body.location;
        let department_id = req.body.department_id;
        let department_name = req.body.department_name || [];
        let location_id;
        let new_location = [];
        let new_department = [];
        let dept_ids = department_id ? department_id.split(",") : [];
        const timezone = req.body.timezone || "Africa/Abidjan";
        const language = req.decoded.language;
        try {

            var validation = joiValidation.addNewDeptToLocationName(location, department_id, department_name, timezone);
            if (validation.error) return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);

            const check_location_name = await LocationModel.checkLocationName(location, organization_id);
            if (check_location_name.length > 0) {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "4")[language] || locationMessages.find(x => x.id === "4")["en"], null);
            }
            if (department_name.length > 0) {
                const check_dept_name = await LocationModel.checkDepartmentName(department_name, organization_id);
                if (check_dept_name.length > 0) {
                    let message = '';
                    check_dept_name.forEach(depart_msg => {
                        message += depart_msg.name + ','
                    });
                    return sendResponse(res, 400, null, message + ` ${translate(locationMessages, 'DEPARTMENT_ALREADY_EXISTS'), language}`, null);
                }
            }

            dept_ids = dept_ids || [];

            const add_location = await LocationModel.addLocation(location, timezone, organization_id);
            if (add_location) {
                if (add_location.insertId) {
                    if (department_name.length > 0) {
                        let Mutliple_department = department_name.map(dept_name => [dept_name, organization_id])

                        const add_department_name = await LocationModel.addDepartmentToLocationByName(Mutliple_department);
                        if (add_department_name) {
                            if (add_department_name.affectedRows > 0) {

                                const get_dept_id = await LocationModel.checkDepartmentName(department_name, organization_id);
                                if (get_dept_id.length > 0) {
                                    get_dept_id.forEach(dept_id_name => {
                                        dept_ids.push(dept_id_name.id);
                                        new_department.push({
                                            department_id: dept_id_name.id,
                                            department_name: dept_id_name.name
                                        })
                                    });
                                }

                            } else {
                                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "6")[language] || locationMessages.find(x => x.id === "6")["en"], null);
                            }
                        }
                    }
                    if (dept_ids.length > 0) {
                        let location_depatment_list = dept_ids.map(id => [id, add_location.insertId])
                        const add_deprt_location_by_ids = await LocationModel.addDepartmentToLocationByIds(location_depatment_list);
                        if (add_deprt_location_by_ids) {
                            if (add_deprt_location_by_ids.affectedRows == 0) {
                                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "6")[language] || locationMessages.find(x => x.id === "6")["en"], null);
                            }
                        }
                    }
                    // req.body.id=add_location.insertId

                    new_location.push({
                        location_id: add_location.insertId || null,
                        location_name: location || null,
                        timezone: timezone || null,
                    })
                    if (new_department.length == 0) {
                        new_department.push(
                            {
                                department_id: null,
                                department_name: null
                            }
                        )
                    }
                    actionsTracker(
                        req, 'Location ? for departments ? created.',
                        [new_department.map(item => item.location_id), req.body.department_id]
                    );
                    return sendResponse(res, 200, {
                        location: new_location,
                        department: new_department,
                        department_ids: req.body.department_id || null
                    }, locationMessages.find(x => x.id === "7")[language] || locationMessages.find(x => x.id === "7")["en"], null);
                }

            } else {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "8")[language] || locationMessages.find(x => x.id === "8")["en"], null);
            }

        } catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "9")[language] || locationMessages.find(x => x.id === "9")["en"], err);
        }

    }

    async UpdateLocation(req, res) {
        const { organization_id, language } = req.decoded;
        let { location_id, name, timezone } = req.body;

        try {
            var validate = joiValidation.updateLocation(name, location_id, timezone);
            if (validate.error) return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], validate.error.details[0].message);


            if (name) {
                const check_location_name = await LocationModel.checkLocationName(name, organization_id, location_id);
                if (check_location_name.length > 0) {
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "4")[language] || locationMessages.find(x => x.id === "4")["en"], null);
                }
            }

            let sql;
            if (name && timezone) {
                sql = `name='${name}', timezone='${timezone}'`
            } else if (name && !timezone) {
                sql = `name='${name}'`
            } else if (!name && timezone) {
                sql = `timezone='${timezone}'`
            } else {
                return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], locationMessages.find(x => x.id === "10")[language] || locationMessages.find(x => x.id === "10")["en"]);
            }

            const update_location = await LocationModel.UpdateLocation(sql, location_id, organization_id);
            if (update_location) {
                if (update_location.affectedRows > 0) {
                    actionsTracker(req, 'Location %i updated.', [location_id]);

                    return sendResponse(res, 200, req.body, locationMessages.find(x => x.id === "11")[language] || locationMessages.find(x => x.id === "11")["en"], null);
                } else {
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "12")[language] || locationMessages.find(x => x.id === "12")["en"], null);
                }
            }

        } catch (err) {
            console.log('----------', err);
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "13")[language] || locationMessages.find(x => x.id === "13")["en"], null);
        }


    }

    async deleteLocation(req, res) {
        const location_id = req.body.location_id;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;

        try {

            var validate = joiValidation.locationId(location_id);
            if (validate.error) {
                return res.json({
                    code: 404,
                    data: null,
                    message: locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"],
                    error: validate.error.details[0].message
                });
            }

            const check_location_user = await LocationModel.checkLocationUsers(location_id, organization_id);
            if (check_location_user.length > 0) {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "14")[language] || locationMessages.find(x => x.id === "14")["en"], null);
            }
            const delete_location = await LocationModel.deleteLocation(location_id, organization_id);
            if (delete_location) {
                if (delete_location.affectedRows > 0) {
                    return sendResponse(res, 200, null, locationMessages.find(x => x.id === "15")[language] || locationMessages.find(x => x.id === "15")["en"], null);
                } else {
                    actionsTracker(req, 'Location %i deleted.', [location_id]);
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "16")[language] || locationMessages.find(x => x.id === "16")["en"], null);
                }
            } else {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "16")[language] || locationMessages.find(x => x.id === "16")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "17")[language] || locationMessages.find(x => x.id === "17")["en"], err);
        }

    }

    async addDepartmentToLocation(req, res) {
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;

        let {
            department_ids,
            location_id,
            department_name,
            short_name
        } = req.body;
        department_ids = department_ids ? department_ids : [];
        department_name = department_name || [];
        let new_department = [];

        try {
            var validation = joiValidation.validateAddDepartmentToLocation(department_ids, location_id, department_name);
            if (validation.error) return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);

            const check_location = await LocationModel.getLocationById(location_id, organization_id);
            if (check_location.length == 0) {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "18")[language] || locationMessages.find(x => x.id === "18")["en"], null);
            }
            if (department_ids.length > 0) {
                const check_location_depts = await LocationModel.checkLocationDepartment(location_id, department_ids);
                if (check_location_depts.length > 0) {
                    if (check_location_depts.length > 0) {
                        let message = '';
                        check_location_depts.forEach(depart_msg => {
                            message += depart_msg.name + ','
                        });
                        return sendResponse(res, 400, null, message + ` ${translate(locationMessages, 'DEPARTMENT_ALREADY_EXISTS_IN_LOCATION', language)}`, null);
                    }
                }
            }
            if (department_name.length > 0) {
                const check_dept_name = await LocationModel.checkDepartmentName(department_name, organization_id, true);
                if (check_dept_name.length > 0) {
                    let message = '';
                    check_dept_name.forEach(depart_msg => {
                        message += depart_msg.name + ','
                    });
                    return sendResponse(res, 400, null, message + ` ${translate(locationMessages, 'DEPARTMENT_ALREADY_EXISTS', language)}`, null);
                } else {
                    const alreadyPres = [];
                    const check_dept_name_deleted = await LocationModel.checkDepartmentName(department_name, organization_id, false);
                    department_name = department_name.filter(d_name => {
                        const temp = check_dept_name_deleted.find(i => i.name == d_name);
                        if (temp) {
                            alreadyPres.push(temp?.id);
                        } else {
                            return true;
                        }
                    });

                    if (alreadyPres.length) {
                        const updateDept = await LocationModel.updateDeptIsdeleted(alreadyPres, organization_id);
                        alreadyPres.forEach(dept_id_name => {
                            const temp = check_dept_name_deleted.find(i => i.id == dept_id_name);
                            department_ids.push(temp.id);
                            new_department.push({
                                department_id: temp.id,
                                department_name: temp.name
                            })
                        });
                    }

                    if (department_name.length) {
                        let Mutliple_department = department_name.map(dept_name => [dept_name, organization_id]);
                        const add_department_name = await LocationModel.addDepartmentToLocationByName(Mutliple_department);
                        if (add_department_name) {
                            if (add_department_name.affectedRows > 0) {
                                const get_dept_id = await LocationModel.checkDepartmentName(department_name, organization_id);
                                if (get_dept_id.length > 0) {
                                    get_dept_id.forEach(dept_id_name => {
                                        department_ids.push(dept_id_name.id);
                                        new_department.push({
                                            department_id: dept_id_name.id,
                                            department_name: dept_id_name.name
                                        })
                                    });
                                }
                            } else {
                                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "6")[language] || locationMessages.find(x => x.id === "6")["en"], null);
                            }
                        } else {
                            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "19")[language] || locationMessages.find(x => x.id === "19")["en"], null);
                        }
                    }
                }
            }

            if (department_ids.length > 0) {
                let location_depatment_list = department_ids.map(id => [id, location_id])
                const add_deprt_location_by_ids = await LocationModel.addDepartmentToLocationByIds(location_depatment_list);
                if (add_deprt_location_by_ids) {
                    if (add_deprt_location_by_ids.affectedRows == 0) {
                        return sendResponse(res, 400, null, locationMessages.find(x => x.id === "6")[language] || locationMessages.find(x => x.id === "6")["en"], null);
                    }
                } else {
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "19")[language] || locationMessages.find(x => x.id === "19")["en"], null);
                }
            }

            if (new_department.length == 0) {
                new_department.push({
                    department_id: null,
                    department_name: null
                })
            }
            actionsTracker(
                req, 'Departments added to location %i.',
                [
                    [...req.body.department_ids || [], ...new_department.map(item => item.department_id)],
                    location_id,
                ],
            );
            return sendResponse(res, 200, {
                location_id: location_id,
                new_department: new_department,
                department_id: req.body.department_ids || null
            }, locationMessages.find(x => x.id === "20")[language] || locationMessages.find(x => x.id === "20")["en"], null);

        } catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "21")[language] || locationMessages.find(x => x.id === "21")["en"], err);
        }

    }


    async deleteLocationDepartmets(req, res) {
        let location_id = req.body.location_id;
        let department_id = req.body.department_id;
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;


        try {
            var validation = joiValidation.deptLocation(location_id, department_id);
            if (validation.error) {
                return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);
            }

            department_id = department_id ? department_id.split(",") : [];
            const check_dept_users = await LocationModel.checkDepartmentUserByIdToDelete(department_id, location_id, organization_id)
            if (check_dept_users.length > 0) {
                let message = '';
                check_dept_users.forEach(dept => {
                    message = message + dept.name + ',';
                });
                let department_list = message.substring(0, message.length - 1);
                return sendResponse(res, 400, null, translate(locationMessages, 'UNABLE_TO_DELETE_DEPARTMENT_USER_EXISTS', language).replace("{{departmentList}}", department_list || ''), null);
            }

            const delete_location_depts = await LocationModel.deleteLocationDepartmets(department_id, location_id);
            if (delete_location_depts) {
                if (delete_location_depts.affectedRows > 0) {
                    actionsTracker(req, 'Delete departments ? from location %i.', [department_id, location_id]);
                    return sendResponse(res, 200, null, locationMessages.find(x => x.id === "22")[language] || locationMessages.find(x => x.id === "22")["en"], null);
                } else {
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "5")[language] || locationMessages.find(x => x.id === "5")["en"], null);
                }
            } else {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "23")[language] || locationMessages.find(x => x.id === "23")["en"], null);
            }
        } catch (err) {
            console.log(err)
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "23")[language] || locationMessages.find(x => x.id === "23")["en"], null);
        }

    }

    async getDepartmentByLocation(req, res) {
        const { organization_id, role_id: login_role_id } = req.decoded;
        const language = req.decoded.language;

        let location_id = req.body.location_id || 0;
        const { role_id } = req.body;
        actionsTracker(req, 'Departments by location %i requested.', [location_id]);

        try {
            var validation = joiValidation.locationId(location_id);
            if (validation.error) {
                return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);
            }

            let departments;
            // let manager_id = req.decoded.employee_id || null;
            let manager_id = null;
            if((req.decoded.is_manager || req.decoded.is_teamlead) && configFile?.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN?.split(',')?.includes(`${organization_id}`)) {
                if (role_id) {
                    departments = await LocationModel.roleDepartment(role_id, req.decoded.employee_id, location_id, login_role_id);
                } else if (role_id && location_id) {
                    departments = await LocationModel.roleDepartment(role_id, req.decoded.employee_id, location_id, login_role_id);
                } else {
                    departments = await LocationModel.getDepartmentByLocation(location_id, organization_id, req.decoded.employee_id, login_role_id);
                }
                if (departments.length > 0) {
                    return sendResponse(res, 200, departments, locationMessages.find(x => x.id === "24")[language] || locationMessages.find(x => x.id === "24")["en"], null);
                } else {
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "25")[language] || locationMessages.find(x => x.id === "25")["en"], null);
                }
            }
            if (role_id) {
                departments = await LocationModel.roleDepartment(role_id, manager_id, location_id, login_role_id);
            } else if (role_id && location_id) {
                departments = await LocationModel.roleDepartment(role_id, manager_id, location_id, login_role_id);
            } else {
                departments = await LocationModel.getDepartmentByLocation(location_id, organization_id, manager_id, login_role_id);
            }
            if (departments.length > 0) {
                return sendResponse(res, 200, departments, locationMessages.find(x => x.id === "24")[language] || locationMessages.find(x => x.id === "24")["en"], null);
            } else {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "25")[language] || locationMessages.find(x => x.id === "25")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "25")[language] || locationMessages.find(x => x.id === "25")["en"], null);
        }
    }
    async getLocation(req, res) {
        let { organization_id, role_id: login_role_id, is_manager, is_teamlead} = req.decoded;
        const { role_id } = req.body;
        const language = req.decoded.language;


        actionsTracker(req, 'Locations requested.');
        try {
            const manager_id = req.decoded.employee_id || null;
            let locations
            // if (role_id) {
            //     locations = await LocationModel.roleLocations(role_id, manager_id, login_role_id);
            // } else {
            //     locations = await LocationModel.fetchLocations(organization_id, manager_id, login_role_id)
            // }

            if((is_manager || is_teamlead) && configFile?.SHOW_SPECIFIC_DEPARTMENT_NON_ADMIN?.split(',')?.includes(`${organization_id}`)) {
                locations = await LocationModel.getLocationBasedOnNonAdmin(manager_id);
                if (locations.length > 0) {
                    return sendResponse(res, 200, locations, locationMessages.find(x => x.id === "1")[language] || locationMessages.find(x => x.id === "1")["en"], null);
                } else {
                    return sendResponse(res, 400, null, locationMessages.find(x => x.id === "18")[language] || locationMessages.find(x => x.id === "18")["en"], null);
                }
            }

            if (role_id) {
                locations = await LocationModel.roleLocations(role_id);
            } else {
                locations = await LocationModel.fetchLocations(organization_id)
            }
            if (locations.length > 0) {
                return sendResponse(res, 200, locations, locationMessages.find(x => x.id === "1")[language] || locationMessages.find(x => x.id === "1")["en"], null);
            } else {
                return sendResponse(res, 400, null, locationMessages.find(x => x.id === "18")[language] || locationMessages.find(x => x.id === "18")["en"], null);
            }
        } catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "27")[language] || locationMessages.find(x => x.id === "27")["en"], null);
        }
    }

    async roles(req, res) {
        const { role_id, location_id } = req.query;
        const { organization_id } = req.decoded;
        const language = req.decoded.language;

        if (role_id && location_id) {
            const departmets = await LocationModel.roleLocationWithDepartment(role_id, location_id);
            return sendResponse(res, 200, departmets, locationMessages.find(x => x.id === "28")[language] || locationMessages.find(x => x.id === "28")["en"], null);
        } else if (role_id) {
            const [locations, departmets] = await Promise.all([
                LocationModel.roleLocation(role_id),
                LocationModel.roleDepartments(role_id)
            ]);
            return sendResponse(res, 200, { locations, departmets }, locationMessages.find(x => x.id === "28")[language] || locationMessages.find(x => x.id === "28")["en"], null);
        } else {
            const roles = await LocationModel.role(organization_id);
            return sendResponse(res, 200, roles, locationMessages.find(x => x.id === "28")[language] || locationMessages.find(x => x.id === "28")["en"], null);
        }
    }


    /*
        * get user geolocation
        *
        * @function getGeoLocation
        * @param {*} req
        * @param {*} res
        * @param {*} next
        * @returns {object} -  location object or error . 
    */
    async getGeoLocation(req, res, next) {
        const organization_id = req.decoded.organization_id;
        const language = req.decoded.language;
        const { employee_id } = req.query;
        try {
            var validation = joiValidation.getGeoLocation(employee_id);
            if (validation.error) return sendResponse(res, 404, null, locationMessages.find(x => x.id === "2")[language] || locationMessages.find(x => x.id === "2")["en"], validation.error.details[0].message);
            let [locationCoordinates] = await LocationModel.getGeoLocation(organization_id, employee_id);
            if (locationCoordinates) {
                locationCoordinates = JSON.parse(locationCoordinates.geolocation)
                return sendResponse(res, 200, { ...locationCoordinates, employee_id }, locationMessages.find(x => x.id === "28")[language] || locationMessages.find(x => x.id === "28")["en"], null);
            }
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "18")[language] || locationMessages.find(x => x.id === "18")["en"], null);
        }
        catch (err) {
            return sendResponse(res, 400, null, locationMessages.find(x => x.id === "3")[language] || locationMessages.find(x => x.id === "3")["en"], err);
        }
    }
}

module.exports = new LocationController;
