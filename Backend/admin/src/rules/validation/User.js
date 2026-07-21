const Joi = require('joi');
const timezones = require('../../utils/helpers/Timezone').timezones;

class User {

    /**Validation for user registation  */
    validateUserRegister(name, full_name, email, password, remember_token, emp_code, location_id, department_id, role_id, date_join, address, status, phone, timezone, timezone_offset) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            full_name: Joi.string().required(),
            email: Joi.string().required(),
            password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!,*()@%&]).{6,20}$/).required().error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
            remember_token: [Joi.string(), Joi.number()],
            emp_code: Joi.string().required(),
            location_id: Joi.number().integer().required(),
            department_id: Joi.number().integer().required(),
            role_id: Joi.number().integer().required(),
            address: Joi.string().required(),
            status: Joi.number().integer(),
            phone: Joi.string().max(15).required().error(() => 'Invalid contact number.'),
            date_join: Joi.date(),
            timezone: Joi.string().allow(null).allow(""),
            timezone_offset: Joi.number().allow(null).allow("")
        });
        var result = Joi.validate({ name, full_name, email, password, remember_token, emp_code, location_id, department_id, role_id, date_join, address, status, phone, timezone, timezone_offset }, schema);
        return result;
    }

    /**Validation for user updatation  */
    validateUserUpdate(user_id, name, full_name, email, password, remember_token, emp_code, location_id, department_id, role_id, date_join, address, status, phone, timezone, timezone_offset) {
        const schema = Joi.object().keys({
            user_id: Joi.number().required(),
            name: Joi.string().allow(null),
            full_name: Joi.string().allow(null),
            email: Joi.string().allow(null),
            password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{6,20}$/).error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter').allow(null),
            remember_token: Joi.string().allow(null),
            emp_code: Joi.string().allow(null),
            location_id: Joi.number().integer().allow(null),
            department_id: Joi.number().integer().allow(null),
            role_id: Joi.number().integer().allow(null),
            address: Joi.string().allow(null),
            status: Joi.number().integer(),
            phone: Joi.string().allow(null),
            date_join: Joi.date().allow(null),
            timezone: Joi.string().allow(null),
            timezone_offset: Joi.number().allow(null)

        });
        var result = Joi.validate({
            user_id,
            name,
            full_name,
            email,
            password,
            remember_token,
            emp_code,
            location_id,
            department_id,
            role_id,
            date_join,
            address,
            status,
            phone,
            timezone,
            timezone_offset
        }, schema);
        return result;
    }

    /** add role Validation */
    addRole(name, params) {
        const schema = Joi.object().keys({
            name: Joi.string().min(3).max(30).required(),
            params: Joi.string().allow(""),
        });
        var result = Joi.validate({
            name,
            params
        }, schema);
        return result;
    }

    skipLimit(skip, limit) {
        const schema = Joi.object().keys({
            limit: Joi.number().integer(),
            skip: Joi.number().integer(),
        });
        var result = Joi.validate({
            skip,
            limit
        }, schema);
        return result;
    }

    /** Fetch users validation */
    fetchUsers(skip, limit, location_id, role_id) {
        const schema = Joi.object().keys({
            department_id: Joi.number().optional().allow(""),
            location_id: Joi.number().optional().allow(""),
            role_id: Joi.number().optional().allow(""),
            skip: Joi.number().integer(),
            limit: Joi.number().integer()
        });
        var result = Joi.validate({
            skip,
            limit,
            location_id,
            role_id
        }, schema);
        return result;
    }
    /** Fetch users validation */
    // fetchUsers(skip, limit, location_id, role_id) {
    //     const schema = Joi.object().keys({
    //         department_id: Joi.any().optional(),
    //         location_id: Joi.any().optional(),
    //         role_id: Joi.any().optional(),
    //         skip: Joi.number().integer(),
    //         limit: Joi.number().integer()
    //     });
    //     var result = Joi.validate({ skip, limit, location_id, role_id }, schema);
    //     return result;
    // }

    validateId(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            id
        }, schema);
        return result;
    }

    validateMultipleId(ids, status) {
        const schema = Joi.object().keys({
            ids: Joi.array().items(Joi.object({
                id: Joi.number().required()
            })).required().min(1),
        });
        var result = Joi.validate({
            ids,
            status
        }, schema);
        return result;
    }

    validateMultipleIds(ids) {
        const schema = Joi.object().keys({
            ids: Joi.array().items(Joi.object({
                user_id: Joi.number().required()
            })).required().min(1),
        });
        var result = Joi.validate({
            ids
        }, schema);
        return result;
    }

    validateMultipleUserId(user_ids, status) {
        const schema = Joi.object().keys({
            user_ids: Joi.array().items(Joi.object({
                user_id: Joi.number().required()
            })).required().min(1),
            // ids: Joi.array().items(Joi.object().keys({
            //     user_id: Joi.number().integer().required()
            // })),
            status: Joi.number().integer()
        });
        var result = Joi.validate({
            user_ids,
            status
        }, schema);
        return result;

    }

    validateManager(user_id, manager_id) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            manager_id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One manager_id Must Required'),
        });
        var result = Joi.validate({
            user_id,
            manager_id
        }, schema);
        return result;
    }
    ManagerValidation(data) {
        const schema = Joi.object().keys({
            manager_id: Joi.number().integer().required(),
            user_id: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One User Must Required'),
        });
        return Joi.validate(data, schema);
    }

    ManagerMultiValidation(data) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            manager_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One Manager Must Required'),
        });
        return Joi.validate(data, schema);
    }

    assignUserValidation(data) {
        const schema = Joi.object().keys({
            user_multi_manager: Joi.object({
                user_id: Joi.number().allow(null).allow(""),
                manager_ids: Joi.array().items(Joi.number().allow(null).allow("")).error(() => 'Atleast One Manager Must Required'),
            }),
            user_teamlead: Joi.object({
                user_ids: Joi.array().items(Joi.number().allow(null).allow("")).error(() => 'Atleast One Manager Must Required'),
                teamlead_id: Joi.number().allow(null).allow(""),
            }),
            user_manager: Joi.object({
                user_ids: Joi.array().items(Joi.number().allow(null).allow("")).error(() => 'Atleast One Manager Must Required'),
                manager_id: Joi.number().allow(null).allow(""),
            })
        });
        return Joi.validate(data, schema);
    }

    validateManagerGrade(user_id, params) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer(),
            params: Joi.string()
        });
        var result = Joi.validate({ user_id, params }, schema);
        return result;
    }

    /**validation for browser history */
    validateBrowserHistory(user_id, date, skip, limit) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            date: Joi.date().required(),
            skip: Joi.number().integer(),
            limit: Joi.number().integer(),

        });
        var result = Joi.validate({
            user_id,
            date,
            skip,
            limit
        }, schema);
        return result;
    }

    /**validation for user details */
    validateUserDetails(user_id, date, skip, limit, from, to, pageToken) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            date: Joi.date().required(),
            skip: Joi.number().integer(),
            limit: Joi.number().integer(),
            mail: Joi.string(),
            pageToken: Joi.string(),
            from: Joi.number(),
            to: Joi.number()
        });
        var result = Joi.validate({
            user_id,
            date,
            skip,
            limit,
            from,
            to,
            pageToken
        }, schema);
        return result;
    }

    userLogValidataion(data) {
        const schema = {
            user_id: Joi.number().integer().required(),
            from_date: Joi.date().required(),
            to_date: Joi.date().required(),
            skip: Joi.number().integer(),
            limit: Joi.number().integer()
        };
        return Joi.validate(data, schema);
    }

    userBroweserHistoryValidataion(data) {
        const schema = {
            user_id: Joi.number().integer().required(),
            from_date: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid date format.'),
            to_date: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid date format.'),
            skip: Joi.number().integer(),
            limit: Joi.number().integer()
        };
        return Joi.validate(data, schema);
    }

    userapplicationUsedValidataion(data) {
        const schema = {
            user_id: Joi.number().integer().required(),
            from_date: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid date format.'),
            to_date: Joi.string().required().regex(/[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/).required().error(() => 'Invalid date format.'),
            skip: Joi.number().integer(),
            limit: Joi.number().integer()
        };
        return Joi.validate(data, schema);
    }

    validateAssignedEmployeeToManager(manager_id, department_id, location_id, skip, limit) {
        const schema = Joi.object().keys({
            department_id: Joi.any().optional(),
            location_id: Joi.number().optional(),
            manager_id: Joi.number().required(),
            skip: Joi.number().integer(),
            limit: Joi.number().integer()
        });
        var result = Joi.validate({
            manager_id,
            department_id,
            location_id,
            skip,
            limit
        }, schema);
        return result;
    }

    validateUnassignToManager(user_id, manager_id) {
        const schema = Joi.object().keys({
            user_id: Joi.array().items(Joi.number().required()).error(() => 'Atleast One UserId Must Required'),
            manager_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({
            user_id,
            manager_id
        }, schema);
        return result;
    }

    validateUnassignToTeamLead(data) {
        const schema = {
            user_ids: Joi.array().items(Joi.number().required()).error(() => 'Atleast One UserId Must Required'),
            teamlead_id: Joi.number().integer().required(),
        };
        return Joi.validate(data, schema);
    }

    /** User search validation */
    userSearch(skip, limit, name, department_ids, location_id, role_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            department_ids: Joi.array().items(Joi.number()),
            location_id: Joi.number(),
            role_id: Joi.number(),
            skip: Joi.number(),
            limit: Joi.number()
        });
        var result = Joi.validate({
            skip,
            limit,
            name,
            department_ids,
            location_id,
            role_id
        }, schema);
        return result;
    }

    /** User search validation */
    UserStatsServiceValidation(skip, limit, department_id, location_id, to_date, from_date) {
        const schema = Joi.object().keys({
            department_id: Joi.number().integer().allow(""),
            location_id: Joi.number().integer().allow(""),
            skip: Joi.number().integer().allow(""),
            limit: Joi.number().integer().allow(""),
            to_date: Joi.date().allow(""),
            from_date: Joi.date().allow(""),
        });
        var result = Joi.validate({
            skip,
            limit,
            department_id,
            location_id,
            to_date,
            from_date
        }, schema);
        return result;
    }

    workingHours(user_id, from_date, to_date, location_id, department_id) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            to_date: Joi.date().required(),
            from_date: Joi.date().required(),
            department_id: Joi.number().integer(),
            location_id: Joi.number().integer(),
        });
        var result = Joi.validate({
            user_id,
            from_date,
            to_date,
            location_id,
            department_id
        }, schema);
        return result;
    }

    getUserWorkingHoursByDepartment(department_id, from_date, to_date) {
        const schema = Joi.object().keys({
            department_id: Joi.number().integer().required(),
            to_date: Joi.date().required(),
            from_date: Joi.date().required(),

        });
        var result = Joi.validate({
            department_id,
            from_date,
            to_date
        }, schema);
        return result;
    }

    activityTrack(user_id, date, skip, limit) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            date: Joi.date().required().required(),
            skip: Joi.number().integer(),
            limit: Joi.number().integer(),

        });
        var result = Joi.validate({
            user_id,
            date,
            skip,
            limit
        }, schema);
        return result;
    }

    userBulkValidate(users, count) {
        const schema = Joi.object().keys({
            users: Joi.array().items(Joi.object().keys({
                FirstName: Joi.string().required(),
                LastName: Joi.string().allow(''),
                Email: Joi.string().required(),
                Password: Joi.string().required(), //.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{6,20}$/).required().error(() => 'Password must contain at least 6 charecters,including UPPER/lowerCase,Number and Special charecter'),
                EmployeeCode: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
                Location: Joi.string().required(),
                Department: Joi.string().required(),
                Role: Joi.number().integer(),
                Address: Joi.string().allow(''),
                Phone: Joi.string().allow(''),
                CountryCode: Joi.string().allow(''),
                DOJ: Joi.date().allow(''),
            })),
            count: Joi.number().required()
        });
        var result = Joi.validate({
            users,
            count
        }, schema);
        return result;
    }

    singleUserValidation(data) {
        const schema = {
            FirstName: Joi.string().regex(/^([a-zA-Z]+\s)*[a-zA-Z]+$/).required().error(() => 'First name required and allowed only charecters'),
            LastName: Joi.string().regex(/^([a-zA-Z]+\s)*[a-zA-Z]+$/).required().error(() => 'Last name required and allowed only charecters'),
            Email: Joi.string().regex(/^[_a-z0-9-A-Z]+(\.[_a-z0-9-A-Z]+)*@[a-z0-9-A-Z]+(\.[a-z0-9-A-Z]+)*(\.[a-zA-Z]{2,3})$/).required().error(() => 'Email must be a valid.'),
            Password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!,*()@%&]).{6,20}$/).required().error(() => 'Password must be valid.'), //,
            EmployeeCode: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
            Location: Joi.string().required(),
            Department: Joi.string().required(),
            Role: Joi.string().valid(['Employee', 'Manager', 'Team Lead']).error(() => 'Role Employee,Team Lead and Manager Allowed.'),
            Address: Joi.string().allow(''),
            Phone: Joi.number().min(9).max(99999999999).required().error(() => 'Invalid phone number.'),
            CountryCode: Joi.number().min(1).max(999).required().error(() => 'Invalid country code.'),
            DOJ: Joi.date().allow('').error(() => 'Date of join format must be MM/DD/YYYY'),
            Timezone: Joi.string().valid(timezones)
        };
        return Joi.validate(data, schema);
    }

    TeamLeadValidation(data) {
        const schema = Joi.object().keys({
            teamlead_id: Joi.number().integer().required(),
            user_ids: Joi.array().items(Joi.number()).min(1).error(() => 'Atleast One User Must Required'),
        });
        return Joi.validate(data, schema);
    }

    updatedetailsValidation(data) {
        const schema = Joi.object().keys({
            new_password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!,*()@%&]).{6,20}$/).required().error(() => 'New password must be valid.'),
            confirmation_password: Joi.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!,*()@%&]).{6,20}$/).required().error(() => 'Confirmation password must be valid.'),
        });
        return Joi.validate(data, schema);
    }

    usersValidataion(data) {
        const schema = {
            department_id: Joi.string().allow(null).allow(""),
            location_id: Joi.number().allow(null).allow(""),
            role_id: Joi.number().allow(null).allow(""),
        };
        return Joi.validate(data, schema);
    }
}

module.exports = new User;