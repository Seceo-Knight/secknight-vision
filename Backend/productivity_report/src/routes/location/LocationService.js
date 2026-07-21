const async = require('async');

const LocationCRUD = require('../shared/LocationCURD');
const DepartmentCURD = require('../shared/DepartmentCURD');
const joiValidation = require('../../rules/validation/Location');
const sendResponse = require('../../utils/myService').sendResponse;

class LocationService {


    /**
     * Add new locations 
     * @function addLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_add_location}
     */
    addLocation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let name = req.body.name;
        let short_name = req.body.short_name;
        const timezone = req.body.timezone || "Africa/Abidjan";
        const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : "0";

        var validation = joiValidation.addLocation({
            name,
            short_name,
            timezone,
            timezone_offset
        });
        if (!short_name) short_name = name;
        if (validation.error) return sendResponse(res, 404, null, "Validation Failed.", validation.error.details[0].message);

        LocationCRUD.checkLocation(name, admin_id, (err, checkLocation) => {
            if (err) return sendResponse(res, 400, null, 'Unable To Add Locations.', err);
            if (checkLocation.length > 0) return sendResponse(res, 400, null, "Location Already Exists.", null);

            LocationCRUD.addLocation(name, short_name, admin_id, timezone, timezone_offset, (err, data) => {
                if (err) return sendResponse(res, 400, null, 'Unable To Add Locations.', err);
                if (data.affectedRows === 0) return sendResponse(res, 400, null, "Location Already Exists.", null);
                return sendResponse(res, 200, {
                    id: data.insertId,
                    name,
                    short_name
                }, "Succefully Location Added.", null);
            });
        });
    }

    /**
     * Get all locations  
     * @function retriveLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_get_locations}
     */
    retriveLocation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        var validate = joiValidation.skipAndLimit(req.body.skip, req.body.limit)
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: "Validation Failed.",
                error: validate.error.details[0].message
            });
        }
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 200;

        LocationCRUD.retrieveLocation(admin_id, skip, limit, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Error While Getting Location.',
                    error: err
                });
            } else if (data.length > 0) {
                return res.json({
                    code: 200,
                    data: data,
                    message: 'Location Data.',
                    error: null
                });
            } else {
                return res.json({
                    code: 200,
                    data: data,
                    message: 'Locations Not Found.',
                    error: null
                });
            }
        })
    }

    /**
     * Delete locations   
     * @function deleteLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/delete_delete_location}
     */
    deleteLocation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let location_id = req.body.location_id;
        var validate = joiValidation.locationId(location_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: "Validation Failed.",
                error: validate.error.details[0].message
            });
        } else {
            LocationCRUD.searchUserByLocation(location_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Error While Deleting Location.',
                        error: err
                    });
                } else if (data.length > 0) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Unable To Delete This Location, Some Users Exist In This Location.',
                        error: null
                    });
                } else {
                    LocationCRUD.deleteLocation(location_id, admin_id, (err, data) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Error While Deleteing Location.',
                                error: err
                            });
                        } else if (data.affectedRows > 0) {
                            return res.json({
                                code: 200,
                                data: null,
                                message: 'Location Deleted Succefully.',
                                error: null
                            });
                        } else {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Invalid Input!',
                                error: err
                            });
                        }
                    })
                }
            })
        }
    }

    /**
     * Update locations   
     * @function updateLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/put_update_location}
     */
    async updateLocation(req, res) {
        let name = req.body.name;
        let short_name = req.body.short_name ? req.body.short_name : req.body.name;
        let location_id = req.body.location_id;
        let admin_id = req['decoded'].jsonData.admin_id;
        const timezone = req.body.timezone;
        const timezone_offset = req.body.timezone_offset / 60;

        var validate = joiValidation.updateLocation(name, short_name, location_id, timezone, timezone_offset);
        if (validate.error) return sendResponse(res, 404, null, "Validation Failed.", validate.error.details[0].message);

        try {
            if (timezone && name) {
                let data = await LocationCRUD.searchByLocationName(name, location_id, admin_id);
                if (data.length > 0) return sendResponse(res, 400, null, 'Location Alredy Exist.', null);

                let values = `name='${name}', short_name= '${short_name}',timezone='${timezone}',timezone_offset='${timezone_offset}'`;
                let condition = `id = ${location_id}`;
                let updated = await LocationCRUD.updateLocation(values, condition);
                return sendResponse(res, 200, req.body, 'Location Updated Succefully.', null);

            } else if (name) {
                let data = await LocationCRUD.searchByLocationName(name, location_id, admin_id);
                if (data.length > 0) return sendResponse(res, 400, null, 'Location Alredy Exist.', null);

                let values = `name='${name}', short_name= '${short_name}'`;
                let condition = `id = ${location_id}`;
                let updated = await LocationCRUD.updateLocation(values, condition);
                return sendResponse(res, 200, req.body, 'Location Updated Succefully.', null);
            } else if (timezone) {
                let values = `timezone='${timezone}',timezone_offset='${timezone_offset}'`;
                let condition = `id = ${location_id}`;
                let updated = await LocationCRUD.updateLocation(values, condition);
                return sendResponse(res, 200, req.body, 'Location Timezone Updated Succefully.', null);
            } else {
                return sendResponse(res, 404, null, "Validation Failed.", 'Name field missing.');
            }
        } catch (err) {
            sendResponse(res, 400, null, 'Unable to update location data.', err);
        }
    }

    /**
     * Get location with all department data   
     * @function fetchLocationWithDepartment
     * @param {*} req
     * @param {*} res
     * @returns {object}- Locations with departments or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_get_locations_dept}
     */
    fetchLocationWithDepartment(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        var validate = joiValidation.skipAndLimit(req.body.skip, req.body.limit)
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: "Validation Failed.",
                error: validate.error.details[0].message
            });
        }
        let skip = parseInt(req.body.skip) || 0;
        let limit = parseInt(req.body.limit) || 200;

        LocationCRUD.getSingleLocation(admin_id, skip, limit, (err, data) => {
            if (err) {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Unable To Get Data.',
                    error: err
                });
            } else if (data.length > 0) {
                async.forEachSeries(data, (location, cb) => {
                    LocationCRUD.locationWithDepartment(location.location_id, admin_id, (err, dept) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Unable To Get Data.',
                                error: err
                            });
                        } else {
                            location.department = dept;
                            cb();
                        }
                    })

                }, () => res.json({
                    code: 200,
                    data: data,
                    message: 'Location With Department Data.',
                    error: err
                }))
            } else {
                return res.json({
                    code: 400,
                    data: null,
                    message: 'Locations Not found.',
                    error: null
                });
            }
        })
    }

    /**
     * Add departments to a location   
     * @function addDepartmentToLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_add_dept_location}
     */
    addDepartmentToLocation_old(req, res) {
        let department_ids = req.body.department_ids;
        var validation = joiValidation.deptDelLocation(department_ids);
        if (validation.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validation.error.details[0].message
            });
        } else {
            async.forEachSeries(department_ids, (e, cb) => {
                LocationCRUD.getSingleLocationWithDepatment(e.location_id, e.department_id, (err, locationData) => {
                    if (err) {
                        cb();
                    } else if (locationData.length > 0) {
                        cb();
                    } else {
                        LocationCRUD.addDepartmentToLocation(e.location_id, e.department_id, (error, data) => {
                            if (error) {
                                cb();
                            } else {
                                cb();
                            }
                        })
                    }
                })
            }, () => {
                return res.json({
                    code: 200,
                    data: null,
                    message: 'Succefully Added Department To A Location.',
                    error: null
                });
            })
            // async.forEachSeries(department_ids, (e, callback) => {

            // }, () => {
            // })
        }
    }

    /**
     * Add departments to a location   
     * @function addDepartmentToLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_add_dept_location}
     */
    addDepartmentToLocation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let {
            department_ids,
            location_id,
            department_name,
            short_name
        } = req.body;
        department_ids = department_ids ? department_ids : [];
        let new_department = [];

        var validation = joiValidation.validateAddDepartmentToLocation(department_ids, location_id, department_name, short_name);
        if (validation.error) return sendResponse(res, 404, null, 'Validation Failed.', validation.error.details[0].message);

        LocationCRUD.checkDepartmentExistsToLocation(admin_id, location_id, department_ids.toString(), (err, data) => {
            if (err) return sendResponse(res, 400, null, 'Unable to Add Department Location', null);
            if (data.length > 0) {
                let message = '';
                async.forEachSeries(data, (department_name, cb) => {
                    message = message + department_name.department_name + ',';
                    cb();
                },
                    () => {
                        message = message.substring(0, message.length - 1);
                        return res.json({
                            code: 400,
                            data: null,
                            message: message + ' Departments Already Exist In Location ' + data[0].location_name,
                            error: err
                        });
                    })
                // return res.json({ code: 400, data: data, message: 'Departments already exists', error: null });
            } else {
                if (department_name) {
                    LocationCRUD.checkMultipleDepartment(department_name, admin_id, (err, departmentData) => {
                        if (err) return sendResponse(res, 400, null, 'Unable to Add Department Location', null);
                        if (departmentData.length > 0) {
                            let message = '';
                            departmentData.map(depart_name => {
                                message += depart_name.name + ','
                            })
                            message = message.substring(0, message.length - 1)
                            // departmentData.forEach(department_names => {
                            //     message+=
                            // });
                            return res.json({
                                code: 400,
                                data: departmentData,
                                message: message + ' Departments Already Exists',
                                error: null
                            });
                        } else {
                            let Mutliple_department = department_name.map(dept_name => [dept_name, dept_name, admin_id,])
                            LocationCRUD.addMultipeDepartment(Mutliple_department, (err, departmentInsertedData) => {
                                if (err) return sendResponse(res, 400, null, 'Unable to Add Department Location', null);
                                LocationCRUD.checkMultipleDepartment(department_name, admin_id, (err, deprt_name_id) => {
                                    if (err) return sendResponse(res, 400, null, 'Unable to Add Department Location', null);

                                    deprt_name_id.forEach(dept_id_element => {
                                        department_ids.push(dept_id_element.id)
                                        new_department.push({
                                            department_id: dept_id_element.id,
                                            department_name: dept_id_element.name
                                        })
                                    });
                                    let Mutliple_deprt_to_loca = department_ids.map(dept_id => [dept_id, location_id, admin_id,])
                                    LocationCRUD.addMultipeDepartmentToLoction(Mutliple_deprt_to_loca, (err, data) => {
                                        if (err) return sendResponse(res, 400, null, 'Unable to Add Department Location', null);
                                        return res.json({
                                            code: 200,
                                            data: {
                                                new_department: new_department.length > 0 ? new_department : [{
                                                    department_name: null,
                                                    department_id: null
                                                }],
                                                location_id: location_id,
                                                department_id: req.body.department_ids ? req.body.department_ids : null
                                            },
                                            message: 'Succefully Added Department To A Location',
                                            error: null
                                        });

                                    })


                                })


                            })
                        }
                    })
                } else {

                    let Mutliple_deprt_to_loca = department_ids.map(dept_id => [dept_id, location_id, admin_id,])
                    LocationCRUD.addMultipeDepartmentToLoction(Mutliple_deprt_to_loca, (err, data) => {
                        if (err) return sendResponse(res, 400, null, 'Unable to Add Department Location', null);
                        return res.json({
                            code: 200,
                            data: {
                                new_department: new_department.length > 0 ? new_department : [{
                                    department_name: null,
                                    department_id: null
                                }],
                                location_id: location_id,
                                department_id: department_ids
                            },
                            message: 'Succefully Added Department To A Location',
                            error: null
                        });
                    });
                }
            }
        })
    }


    /**
     * Delete department from location 
     * @function deleteDepartmentFromLocation
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/delete_delete_dept_location}
     */
    deleteDepartmentFromLocation(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let location_id = req.body.location_id;
        let department_id = req.body.department_id;
        if (department_id) {
            var deptIds = department_id.split(",");
            deptIds.forEach(department_id => {
                var validation = joiValidation.deptLocation(location_id, department_id);
                if (validation.error) {
                    return res.json({
                        code: 404,
                        data: null,
                        message: 'Validation Failed.',
                        error: validation.error.details[0].message
                    });
                }
            });
            LocationCRUD.checkUserInDepartment(location_id, department_id, admin_id, (err, user_data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Unable Delete Department.',
                        error: err
                    });
                } else if (user_data.length > 0) {
                    var seenNames = {};
                    let department_name = '';
                    user_data.filter(function (currentObject) {
                        if (currentObject.department_name in seenNames) {
                            return false;
                        } else {
                            seenNames[currentObject.department_name] = true;
                            department_name += currentObject.department_name + ",";
                            return true;
                        }
                    });
                    let department_list = department_name.substring(0, department_name.length - 1);
                    return res.json({
                        code: 400,
                        data: user_data,
                        message: 'Unable To Delete This Department ,Some Users Exsist In ' + department_list + ' departmets',
                        error: err
                    });
                } else {
                    LocationCRUD.deleteDepartmentFromLocation(location_id, department_id, admin_id, (err, data) => {
                        if (err) {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Unable Delete Department.',
                                error: err
                            });
                        } else if (data.affectedRows > 0) {
                            return res.json({
                                code: 200,
                                data: null,
                                message: 'Succefully Deleted Department From Location.',
                                error: err
                            });
                        } else {
                            return res.json({
                                code: 400,
                                data: null,
                                message: 'Invalid Input.',
                                error: null
                            });
                        }
                    })
                }
            })

        } else {
            return res.json({
                code: 404,
                data: null,
                message: 'Department Id Missing.',
                error: null
            });
        }
    }

    /**
     *Get department by locations
     * @function getDepartmentsByLocations
     * @param {*} req                                   
     * @param {*} res
     * @returns {object}- Departments list or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_get_department_by_location}
     */
    getDepartmentsByLocations(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let location_id = req.body.location_id;
        var validate = joiValidation.locationId(location_id);
        if (validate.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validate.error.details[0].message
            });
        }
        if (location_id) {
            LocationCRUD.locationWithDepartment(location_id, admin_id, (err, dept) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Unable To Get Data.',
                        error: err
                    });
                } else if (dept.length > 0) {
                    return res.json({
                        code: 200,
                        data: dept,
                        message: 'Department data.',
                        error: err
                    });
                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: ' No Location And Departments Found.',
                        error: null
                    });
                }
            })
        } else {
            LocationCRUD.getDepartment(admin_id, (err, data) => {
                if (err) {
                    return res.json({
                        code: 400,
                        data: null,
                        message: 'Unable To Get Data.',
                        error: err
                    });
                } else if (data.length > 0) {
                    return res.json({
                        code: 200,
                        data: data,
                        message: 'Department Data.',
                        error: err
                    });
                } else {
                    return res.json({
                        code: 400,
                        data: null,
                        message: ' No Location And Departments Found.',
                        error: null
                    });
                }
            })
        }
    }

    /**
     *Add department to a location
     * @function addDepartmentToLocationName
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_add_dept_location_by_name}
     */
    addDepartmentToLocationName(req, res) {
        let admin_id = req['decoded'].jsonData.admin_id;
        let location = req.body.location;
        let department_id = req.body.department_id;
        let location_id;
        let short_name = req.body.short_name;
        const timezone = req.body.timezone || "Africa/Abidjan";
        const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : "0";
        if (location && department_id) {
            LocationCRUD.checkLocation(location, admin_id, (err, checkLocation) => {
                if (err) {
                    return res.json({
                        code: 404,
                        data: null,
                        message: 'Failed To Insert New Location.',
                        error: err
                    });
                }
                if (!short_name) short_name = name;
                if (checkLocation.length > 0) return res.json({
                    code: 400,
                    data: null,
                    message: 'Location Already Exists.',
                    error: err
                });

                LocationCRUD.addLocation(location, short_name, admin_id, timezone, timezone_offset, (err, insertLocationData) => {
                    if (err) return sendResponse(res, 400, null, 'Unable to add location', err);
                    location_id = insertLocationData.insertId != 0 ? insertLocationData.insertId : checkLocation[0].id;
                    let department_ids = department_id.split(",")
                    async.forEachSeries(department_ids, (departmentId, cb) => {

                        LocationCRUD.getSingleLocationWithDepatment(location_id, departmentId, admin_id, (err, locationData) => {
                            if (err) {
                                cb();
                            } else if (locationData.length > 0) {
                                cb();
                            } else {
                                LocationCRUD.addDepartmentToLocation(location_id, departmentId, admin_id, (error, data) => {
                                    if (error) {
                                        cb();
                                    } else {
                                        cb();
                                    }
                                })
                            }
                        })
                    }, () => {
                        return res.json({
                            code: 200,
                            data: null,
                            message: 'Succefully Added Department To A Location.',
                            error: null
                        });
                    })


                })

            })

        } else {
            return res.json({
                code: 400,
                data: null,
                message: 'Field Is Missing.',
                error: null
            });
        }
    }

    /**
     * Add department to a location and also ading new departments to locations 
     * @function addNewDepartmentToLocationName
     * @param {*} req
     * @param {*} res
     * @returns {object}- Success message or error 
     * @memberof LocationService
     *  @see also {@link https://admin.empmonitor.com/api/v1/explorer/#/Location/post_add_old_dept_location_by_name}
     */
    addNewDepartmentToLocationName(req, res) {

        let admin_id = req['decoded'].jsonData.admin_id;
        let location = req.body.location;
        let department_id = req.body.department_id;
        let department_name = req.body.department_name;
        let dept_short_name = req.body.dept_short_name ? req.body.dept_short_name : req.body.department_name;
        let location_id;
        let new_location = [];
        let new_department = [];
        let short_name = req.body.short_name;
        let dept_ids = department_id ? department_id.split(",") : 0;
        const timezone = req.body.timezone || "Africa/Abidjan";
        const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : 0;

        var validation = joiValidation.addNewDeptToLocationName(location, department_id, short_name, department_name, dept_short_name);
        if (validation.error) {
            return res.json({
                code: 404,
                data: null,
                message: 'Validation Failed.',
                error: validation.error.details[0].message
            });
        }
        let new_location_id;
        if (location && (department_id || department_name)) {
            LocationCRUD.checkLocation(location, admin_id, (err, checkLocation) => {
                if (err) return res.json({
                    code: 400,
                    data: null,
                    message: 'Failed To Insert New Location.',
                    error: err
                });

                if (!short_name) short_name = location;
                if (checkLocation.length > 0) return res.json({
                    code: 400,
                    data: null,
                    message: `Location ${location} Already Exist.`,
                    error: err
                });

                LocationCRUD.addLocation(location, short_name, admin_id, timezone, timezone_offset, (err, insertLocationData) => {
                    if (err) {
                        return res.json({
                            code: 400,
                            data: null,
                            message: 'Failed To Insert New Location.',
                            error: err
                        });
                    } else {
                        location_id = insertLocationData.insertId != 0 ? insertLocationData.insertId : checkLocation[0].id;
                        new_location.push({
                            location_id: location_id ? location_id : null,
                            location_name: location ? location : null,
                            short_name: short_name ? short_name : location
                        })
                        LocationCRUD.checkDepartmentToLocation(location_id, dept_ids, admin_id, (err, data) => {

                            new_location_id = location_id;
                            if (err) {
                                return res.json({
                                    code: 400,
                                    data: null,
                                    message: 'Failed To Insert New Department.',
                                    error: err
                                });
                            } else if (data.length > 0) {
                                let message = '';
                                async.forEachSeries(data, (department_name, cb) => {
                                    message = message + department_name.department_name + ',';
                                    cb();
                                },
                                    () => {
                                        message = message.substring(0, message.length - 1);
                                        return res.json({
                                            code: 400,
                                            data: null,
                                            message: message + ' Departments Already Exist In Location ' + data[0].location_name,
                                            error: err
                                        });
                                    })
                            } else {
                                if (department_name) {
                                    LocationCRUD.checkDepartment(department_name, admin_id, (err, checkDepartment) => {
                                        if (err) {
                                            return res.json({
                                                code: 400,
                                                data: null,
                                                message: 'Failed To Insert New Department.',
                                                error: err
                                            });
                                        } else if (checkDepartment.length > 0) {
                                            return res.json({
                                                code: 400,
                                                data: null,
                                                message: department_name + ' Department Is Already Exist.',
                                                error: err
                                            });
                                        }
                                        LocationCRUD.addNewDepartment(department_name, dept_short_name, admin_id, (err, data) => {
                                            if (err) {
                                                return res.json({
                                                    code: 400,
                                                    data: null,
                                                    message: 'Failed To Insert New Department.',
                                                    error: err
                                                });
                                            }
                                            if (data.insertId != 0) {
                                                department_id += ',' + data.insertId;
                                                new_department.push({
                                                    department_id: data.insertId ? data.insertId : null,
                                                    department_name: department_name ? department_name : null
                                                })

                                            } else if (checkDepartment[0].id) {
                                                department_id += ',' + checkDepartment[0].id;
                                            }
                                            let department_Ids = department_id ? department_id.split(",") : 0;

                                            async.forEachSeries(department_Ids, (departmentId, cb) => {

                                                LocationCRUD.getSingleLocationWithDepatment(location_id, departmentId, admin_id, (err, locationData) => {
                                                    if (err) {
                                                        cb();
                                                    } else if (locationData.length > 0) {
                                                        cb();
                                                    } else {

                                                        LocationCRUD.addDepartmentToLocation(location_id, departmentId, admin_id, (error, data) => {
                                                            if (error) {
                                                                cb();
                                                            } else {
                                                                cb();
                                                            }
                                                        })
                                                    }
                                                })
                                            }, () => {
                                                return res.json({
                                                    code: 200,
                                                    data: {
                                                        location: new_location,
                                                        department: new_department,
                                                        department_ids: req.body.department_id ? req.body.department_id : null
                                                    },
                                                    message: 'Succefully Added Department To A Location',
                                                    error: null
                                                });
                                            })
                                        })
                                    })

                                } else {
                                    let department_ids = department_id.split(",");

                                    async.forEachSeries(department_ids, (departmentId, cb) => {

                                        LocationCRUD.getSingleLocationWithDepatment(location_id, departmentId, admin_id, (err, locationData) => {
                                            if (err) {
                                                cb();
                                            } else if (locationData.length > 0) {
                                                cb();
                                            } else {
                                                LocationCRUD.addDepartmentToLocation(location_id, departmentId, admin_id, (error, data) => {
                                                    if (error) {
                                                        cb();
                                                    } else {
                                                        cb();
                                                    }
                                                })
                                            }
                                        })
                                    }, () => {
                                        return res.json({
                                            code: 200,
                                            data: {
                                                location: [{
                                                    location_id: new_location_id,
                                                    location_name: req.body.location,
                                                    short_name: short_name
                                                }],
                                                department: [{
                                                    department_id: null,
                                                    department_name: null
                                                }],
                                                department_ids: req.body.department_id ? req.body.department_id : null
                                            },
                                            message: 'Succefully Added Department To A Location',
                                            error: null
                                        });
                                    })
                                }
                            }
                        })


                    }

                })

            })

        } else {
            return res.json({
                code: 400,
                data: null,
                message: 'Field Is Missing ',
                error: null
            });
        }
    }



    addMultipleDepartmentToLocationName(req, res) {

        let admin_id = req['decoded'].jsonData.admin_id;
        let location = req.body.location;
        let department_id = req.body.department_id;
        let department_name = req.body.department_name;
        let dept_short_name = req.body.dept_short_name ? req.body.dept_short_name : req.body.department_name;
        let location_id;
        let new_location = [];
        let new_department = [];
        let short_name = req.body.short_name;
        let dept_ids = department_id ? department_id.split(",") : 0;
        const timezone = req.body.timezone || "Africa/Abidjan";
        const timezone_offset = req.body.timezone_offset ? (req.body.timezone_offset / 60) : "0";

        var validation = joiValidation.addNewDeptToLocationName(location, department_id, short_name, department_name, timezone, timezone_offset);
        if (validation.error) return sendResponse(res, 404, null, 'Validation Failed.', validation.error.details[0].message);

        department_name = req.body.department_name ? req.body.department_name : "";
        let new_location_id;
        if (location && (department_id || department_name)) {
            LocationCRUD.checkLocation(location, admin_id, (err, checkLocation) => {
                if (err) return sendResponse(res, 400, null, 'Failed To Insert New Location.', null);
                if (!short_name) short_name = location;
                if (checkLocation.length > 0) return sendResponse(res, 400, null, `Location ${location} Already Exist.`, null);

                LocationCRUD.checkMultipleDepartment(department_name, admin_id, (err, checkDepartment) => {
                    if (err) return sendResponse(res, 400, null, 'Failed To Insert New Location.', null);
                    if (checkDepartment.length > 0) {
                        let message = '';
                        checkDepartment.forEach(depart_msg => {
                            message += depart_msg.name + ','
                        });
                        message = message.substring(0, message.length - 1)
                        return res.json({
                            code: 400,
                            data: null,
                            message: message + ' Department Is Already Exist.',
                            error: err
                        });
                    }

                    LocationCRUD.addLocation(location, short_name, admin_id, timezone, timezone_offset, (err, insertLocationData) => {
                        if (err) return sendResponse(res, 400, null, 'Failed To Insert New Location.', null);
                        location_id = insertLocationData.insertId != 0 ? insertLocationData.insertId : checkLocation[0].id;
                        new_location.push({
                            location_id: location_id ? location_id : null,
                            location_name: location ? location : null,
                            short_name: short_name ? short_name : location,
                            timezone: timezone,
                            timezone_offset: timezone_offset
                        })
                        LocationCRUD.checkDepartmentToLocation(location_id, dept_ids, admin_id, (err, data) => {

                            new_location_id = location_id;
                            if (err) return sendResponse(res, 400, null, 'Unable to add new department', err);
                            if (data.length > 0) {
                                let message = '';
                                async.forEachSeries(data, (department_name, cb) => {
                                    message = message + department_name.department_name + ',';
                                    cb();
                                },
                                    () => {
                                        message = message.substring(0, message.length - 1);
                                        return res.json({
                                            code: 400,
                                            data: null,
                                            message: message + ' Departments Already Exist In Location ' + data[0].location_name,
                                            error: err
                                        });
                                    })
                            } else {
                                if (department_name) {
                                    let Mutliple_department = department_name.map(dept_name => [dept_name, dept_name, admin_id,])
                                    LocationCRUD.addMultipeDepartment(Mutliple_department, (err, data) => {
                                        if (err) return sendResponse(res, 400, null, 'Unable To Add New Department.', err);
                                        LocationCRUD.checkMultipleDepartment(department_name, admin_id, (err, dept_id_data) => {
                                            if (err) return sendResponse(res, 400, null, 'Unable To Add New Department.', err);
                                            dept_id_data.forEach(dept_id_name => {
                                                department_id += ',' + dept_id_name.id;
                                                new_department.push({
                                                    department_id: dept_id_name.id,
                                                    department_name: dept_id_name.name
                                                })
                                            });

                                            let department_Ids = department_id ? department_id.split(",") : 0;

                                            async.forEachSeries(department_Ids, (departmentId, cb) => {
                                                LocationCRUD.getSingleLocationWithDepatment(location_id, departmentId, admin_id, (err, locationData) => {
                                                    if (err) {
                                                        cb();
                                                    } else if (locationData.length > 0) {
                                                        cb();
                                                    } else {
                                                        LocationCRUD.addDepartmentToLocation(location_id, departmentId, admin_id, (error, data) => {
                                                            if (error) {
                                                                cb();
                                                            } else {
                                                                cb();
                                                            }
                                                        })
                                                    }
                                                })
                                            }, () => {
                                                return res.json({
                                                    code: 200,
                                                    data: {
                                                        location: new_location,
                                                        department: new_department,
                                                        department_ids: req.body.department_id ? req.body.department_id : null
                                                    },
                                                    message: 'Succefully Added Department To A Location',
                                                    error: null
                                                });
                                            });
                                        });
                                    });
                                } else {
                                    let department_ids = department_id.split(",");
                                    async.forEachSeries(department_ids, (departmentId, cb) => {

                                        LocationCRUD.getSingleLocationWithDepatment(location_id, departmentId, admin_id, (err, locationData) => {
                                            if (err) {
                                                cb();
                                            } else if (locationData.length > 0) {
                                                cb();
                                            } else {
                                                LocationCRUD.addDepartmentToLocation(location_id, departmentId, admin_id, (error, data) => {
                                                    if (error) {
                                                        cb();
                                                    } else {
                                                        cb();
                                                    }
                                                })
                                            }
                                        })
                                    }, () => {
                                        return res.json({
                                            code: 200,
                                            data: {
                                                location: [{
                                                    location_id: new_location_id,
                                                    location_name: req.body.location,
                                                    short_name: short_name,
                                                    timezone: req.body.timezone ? req.body.timezone : null,
                                                    timezone_offset: req.body.timezone_offset ? req.body.timezone_offset : null
                                                }],
                                                department: [{
                                                    department_id: null,
                                                    department_name: null
                                                }],
                                                department_ids: req.body.department_id ? req.body.department_id : null
                                            },
                                            message: 'Succefully Added Department To A Location',
                                            error: null
                                        });
                                    });
                                }
                            }
                        });
                    });
                });
            })

        } else {
            return sendResponse(res, 400, null, 'Field Is Missing ', null);
        }
    }
}

module.exports = new LocationService;



// let array = [{
//     "name": "Peter",
//     "age": 30,
//     "hair color": "brown"
// }, {
//     "name": "Steve",
//     "age": 55,
//     "hair color": "blonde"
// }, {
//     "name": "Steve",
//     "age": 55,
//     "hair color": "blonde"
// }]
// let array = [{ id: 82, name: 'test123', department_name: 'Dot Net' },
// { id: 101, name: 'Rahul Agnihotri', department_name: 'node js' }
//     ,
// { id: 111, name: 'test123', department_name: 'php' },
// { id: 130, name: 'checking', department_name: 'Dot Net' }]
// var seenNames = {};
// let department_name = '';

// array = array.filter(function (currentObject) {
//     if (currentObject.department_name in seenNames) {
//         return false;
//     } else {
//         seenNames[currentObject.department_name] = true;
//         department_name += currentObject.department_name + ",";

//         return true;
//     }
// });

// console.log(department_name.substring(0, department_name.length - 1));



// let department_Ids = [1, 2, 4, 8, 9]
// let location_department_ids = [];
// let a = department_Ids.map(item => [item, 100, 200]);
// console.log(a)


// let token = `14f893bbaa8f1a8ae79bf317096b73b9:08cfc6f7eb1ff48eeb3cf21145b7c2dd671478430a356ff8ec9af08dd1cf03da8870992006aa48af04fbbf117b42a11ddee4ed43d9d2f12e95b70c718afdd98c2a04cabe6848f8bc9b440893e601a9a8e11535b3333c598d1a30bfe361f242e6096858b0d2a34b33bf527a05d548c6b7a17a5f17e094b8a40e546ca8860e0a884f2102a8d7a6c749565e88f29a034790dc24df017c2df7ce07aacd902b8d986ff189d9d4ebb4a4e195942f1b92046b54bde51ead2e6db8b543a96d4d4ed67e524115a90ad155ac2e895e27a54812a3ee31c14ca3cadace9905b91691fb1d2bdad65772bf0b1618d743b0eb956a861fd707be991769f3a558ab8d064c1838f853ec8d996d72165e577e3495a599d9b432f905314b79198a552a358c54cd579be80e3fac9799d1504941af2b792a26d9a6cb8f08ccbd671dd4e11971080d12bfae230b6c8b2e9598782741fb1c5e954b97d401573f9acd8961f816e84b8311121b87f24654a0bbbed210fd28e3a7f017d2d1eac74cd556933b681f381d064244dae19f41e5399eda5b3442afd932fa5162e03095c4718a717ace43609aed65049d84f433a7ca6f6ef55013dd13b2278a7ea63c07b4a4c67436ed5bdfe19457bf7e3096596a725da05bcdd59b66fcc0209485e7279aa417b7e6b7e01754ddc0f862511fe7d8809fa106c513f1a3103f2b1ba7fa20dae34974882979b6d32d33b6c70c5eccfa1919bed62cd39e4264c29b29257089f94d1972d1d1b8b6b1248aa1ef1f2e6c26ff0b1487a782b298798078b0`;
// let url = "http://localhost:3002/api/v1";
// let user_agent = "1234"
// var request = require('request');


// request.post({
//     headers: { "x-access-token": token, "user-agent": user_agent },
//     url: "http://localhost:3002/api/v1/create-departments", form: {
//         "name": "Node js",
//         "short_name": "NODE",
//     }
// },
//     function (error, response, body) {
//         console.log(body, '====================================', error)
//         // body = JSON.parse(body)

//     });

// let department_name = ['sdfsadf', 'dasdfasd', 'asdfasdf']
// let Mutliple_department = department_name.map(dept_name => [dept_name, 1, dept_name])
// console.log(Mutliple_department)