const _ = require('underscore');
const moment = require('moment');

const PrService = require('./Productivity.model');
const PrValidator = require('./Productivity.validator');
const Common = require('../../../utils/helpers/Common');

class PrController {

    async getProductivityOld(req, res, next) {
        try {
            const admin_id = req['decoded'].jsonData.admin_id;
            const { location_id, department_id, user_id, startDate, endDate } = await PrValidator.getProductivity().validateAsync(req.query);

            let attendance_ids = await PrService.getAttendanceIds(user_id, startDate, endDate);
            
            const promiseArr = attendance_ids.map(x => { return PrService.getProductivity(x.id) });

            const asd = await Promise.all(promiseArr);
            console.log(asd)
            return res.json(asd);
            return res.json({ code: 200, data: data, message: 'Productivity.', error: null });
        } catch (err) {
            next(err);
        }
    }
    // async getProductivity(req, res, next) {
    //     try {
    //         const admin_id = req['decoded'].jsonData.admin_id;
    //         const { location_id, department_id, user_id, startDate, endDate } = await PrValidator.getProductivity().validateAsync(req.query);

    //         let attendance_ids = await PrService.getAttendanceIds(user_id, startDate, endDate);
            
    //         const promiseArr = attendance_ids.map(x => { return PrService.getProductivity(x.id) });

    //         const asd = await Promise.all(promiseArr);
    //         console.log(asd)
    //         return res.json(asd);
    //         return res.json({ code: 200, data: data, message: 'Productivity.', error: null });
    //     } catch (err) {
    //         next(err);
    //     }
    // }

    async getProductivityListDeployed(req, res, next) {
        try {
            const organization_id = req['decoded'].jsonData.admin_id;
            let {page, limit, location_id, department_id, employee_id, startDate, endDate} = await PrValidator.getProductivityList().validateAsync(req.query);

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            let total, results;

            if(employee_id) {
                results = await PrService.getUserProductivityList({employee_id, startDate, endDate});
                if(results.length > 0) {
                    total = 1;
                    const users = await PrService.getEmployeeNames(_.pluck(results, 'employee_id'))

                    results = results.map(item => {
                        return {
                            ...item,
                            name: users.find(x => x.id === item.employee_id).name
                        }
                    })
                }
            } else if(department_id) {
                const data = await Promise.all([
                    PrService.getDepartmentProductivityListCount({department_id, startDate, endDate}),
                    PrService.getDepartmentProductivityList({department_id, startIndex, limit, startDate, endDate})
                ]);

                results = data[1];
                if(data[0].length > 0) {
                    total = data[0][0].total;
                }

                if(results.length > 0) {
                    const users = await PrService.getEmployeeNames(_.pluck(results, 'employee_id'))

                    results = results.map(item => {
                        return {
                            ...item,
                            name: users.find(x => x.id === item.employee_id).name
                        }
                    })
                }
            } else {
                results = await PrService.getLocationProductivityList({location_id, startDate, endDate});

                if(results.length > 0) {
                    total = 1;
                    const users = await PrService.getLocationNames(_.pluck(results, 'location_id'))

                    results = results.map(item => {
                        return {
                            ...item,
                            name: users.find(x => x.id === item.location_id).name
                        }
                    })
                }
            }

            // Pagination result
            const pagination = {};
        
            if (startIndex > 0) {
                pagination.prev = { page: page - 1, };
            }

            if (endIndex < total) {
                pagination.next = { page: page + 1, };
            }

            res.json({
                code: 200,
                total,
                pagination,
                data: results,
                hasMoreData: endIndex >= total ? false : true,
                message: 'Productivity List.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }
    async getProductivityList(req, res, next) {
        try {
            const organization_id = req['decoded'].jsonData.admin_id;
            let {page, limit, location_id, department_id, employee_id, startDate, endDate} = await PrValidator.getProductivityList().validateAsync(req.query);

            // Pagination
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            let total = 0;
            let search_type, search_value;

            if(employee_id) {
                if(employee_id === 'All') { search_type = 'employee'; search_value = 'All'; }
                else { search_type = 'employee'; search_value = employee_id; }
            } else if(department_id) {
                if(department_id === 'All') { search_type = 'department'; search_value = 'All'; }
                else { search_type = 'department'; search_value = department_id; }
            } else if(location_id) {
                if(location_id === 'All') { search_type = 'location'; search_value = 'All'; }
                else { search_type = 'location'; search_value = location_id; }
            } else {
                search_type = 'organization';
                search_value = organization_id;
            }


            let [count, results] = await Promise.all([
                PrService.getProductivityListCount({organization_id, search_type, search_value, startDate, endDate}),
                PrService.getProductivityList({organization_id, search_type, search_value, startIndex, limit, startDate, endDate})
            ]);
            // results = await PrService.getProductivityList({organization_id, search_type, search_value, startIndex, limit, startDate, endDate});
            
            if(results.length > 0) {
                const names = await PrService.getNames({ ids: _.pluck(results, '_id'), search_type});
    
                results = results.map(item => {
                    const data = {
                        ...item,
                        name: names.find(x => x.id === item._id).name
                    }
                    delete data._id;
    
                    return data;
                })
            }

            if(count.length === 0) {
                total = 0;
            } else {
                total = count[0].total;
            }

            // Pagination result
            const pagination = {};
        
            if (startIndex > 0) {
                pagination.prev = { page: page - 1, };
            }

            if (endIndex < total) {
                pagination.next = { page: page + 1, };
            }

            res.json({
                code: 200,
                total,
                pagination,
                data: results,
                hasMoreData: endIndex >= total ? false : true,
                message: 'Productivity List.',
                error: null
            });
        } catch (err) {
            next(err);
        }
    }

    async getProductivity(req, res, next) {
        try {
            const organization_id = req['decoded'].jsonData.admin_id;
            const { location_id, department_id, user_id, startDate, endDate } = await PrValidator.getProductivity().validateAsync(req.query);

            let search_type, search_value;
            if(user_id) {
                search_type = "user_id";
                search_value = user_id;
            } else if(department_id) {
                search_type = "department_id";
                search_value = department_id;
            } else if(location_id) {
                search_type = "location_id";
                search_value = location_id;
            } else {
                search_type = "organization";
                search_value = organization_id;
            }
            
            const productivity = await PrService.getProductivity({ search_type, search_value, startDate, endDate });

            const respObj = productivity.map(item => {
                return {
                    date: Common.yyyymmdd_to_yyyy_mm_dd(item.yyyymmdd),
                    total_duration: item.productive_duration + item.non_productive_duration + item.neutral_duration,
                    productive_duration: item.productive_duration,
                    non_productive_duration: item.non_productive_duration,
                    neutral_duration: item.neutral_duration
                }
            });

            return res.json({ code: 200, data: respObj, message: 'Productivity.', error: null });
        } catch (err) {
            next(err);
        }
    }

}

module.exports = new PrController;

// (async () => {
//     try {
//         const asd = await PrValidator.getProductivityList().validateAsync({
//             location_id: 'All',
//             department_id: 'All',
//             employee_id: 'All',
//             startDate: '2020-05-14',
//             endDate: '2020-05-15'
//         });

//         console.log(asd)
//     } catch (err) {
//         console.log(err);
//     }
// })();