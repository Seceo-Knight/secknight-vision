
const mySql = require('../../../database/MySqlConnection').getInstance();
const EmpProductivityReportsModel = require('../../../models/employee_productivity.schema');

class PrModel {
    getProductivity({search_type, search_value, startDate, endDate}) {
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };
        let group = {
            yyyymmdd: { $first: '$yyyymmdd' },
            productive_duration: { $sum: '$productive_duration' },
            non_productive_duration: { $sum: '$non_productive_duration' },
            neutral_duration: { $sum: '$neutral_duration' }
        };

        switch (search_type) {
            case "user_id":
                match =  { employee_id: search_value, ...match };
                break;

            case "department_id":
                match = { department_id: search_value, ...match }
                group = { _id: { department_id: "$department_id", yyyymmdd: "$yyyymmdd" }, ...group }
                break;

            case "location_id":
                match = { location_id: search_value, ...match }
                group = { _id: { location_id: "$location_id", yyyymmdd: "$yyyymmdd" }, ...group }
                break;
        
            default:
                match = { organization_id: search_value, ...match };
                group = { _id: { organization_id: "$organization_id", yyyymmdd: "$yyyymmdd" }, ...group };
                break;
        }

        if(search_type === "user_id") return EmpProductivityReportsModel.aggregate([ { $match: match }, { $sort: { yyyymmdd: -1 } } ]);
        return EmpProductivityReportsModel.aggregate([ { $match: match }, { $sort: { yyyymmdd: -1 } }, { $group: group } ]);
    }

    getLocationProductivityList({location_id, startDate, endDate}) {
        return EmpProductivityReportsModel.aggregate([
            {
                $match: {
                    location_id: location_id,
                    yyyymmdd: {
                        $gte: parseInt(startDate.split('-').join('')),
                        $lte: parseInt(endDate.split('-').join(''))
                    }
                }
            },
            {
                $group: {
                    _id: '$location_id',
                    location_id: { $first: '$location_id' },
                    productive_duration: { $sum: '$productive_duration' },
                    non_productive_duration: { $sum: '$non_productive_duration' },
                    neutral_duration: { $sum: '$neutral_duration' }
                }
            },
            { $project: { _id: 0 } }
        ]);
    }

    getUserProductivityList({employee_id, startDate, endDate}) {
        return EmpProductivityReportsModel.aggregate([
            {
                $match: {
                    employee_id: employee_id,
                    yyyymmdd: {
                        $gte: parseInt(startDate.split('-').join('')),
                        $lte: parseInt(endDate.split('-').join(''))
                    }
                }
            },
            {
                $group: {
                    _id: '$employee_id',
                    employee_id: { $first: '$employee_id' },
                    productive_duration: { $sum: '$productive_duration' },
                    non_productive_duration: { $sum: '$non_productive_duration' },
                    neutral_duration: { $sum: '$neutral_duration' }
                }
            },
            { $project: { _id: 0 } }
        ]);
    }
    getDepartmentProductivityListCount({department_id, startDate, endDate}) {
        return EmpProductivityReportsModel.aggregate([
            {
                $match: {
                    department_id: department_id,
                    yyyymmdd: {
                        $gte: parseInt(startDate.split('-').join('')),
                        $lte: parseInt(endDate.split('-').join(''))
                    }
                }
            },
            { $group: { _id: '$employee_id', } },
            { $count: "total" }
        ]);
    }
    getDepartmentProductivityList({department_id, startIndex, limit, startDate, endDate}) {
        return EmpProductivityReportsModel.aggregate([
            {
                $match: {
                    department_id: department_id,
                    yyyymmdd: {
                        $gte: parseInt(startDate.split('-').join('')),
                        $lte: parseInt(endDate.split('-').join(''))
                    }
                }
            },
            {
                $group: {
                    _id: '$employee_id',
                    employee_id: { $first: '$employee_id' },
                    productive_duration: { $sum: '$productive_duration' },
                    non_productive_duration: { $sum: '$non_productive_duration' },
                    neutral_duration: { $sum: '$neutral_duration' }
                }
            },
            { $project: { _id: 0 } },
            { $skip: startIndex },
            { $limit: limit }
        ]);
    }

    getProductivityListCount({organization_id, search_type, search_value, startDate, endDate}) {
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };
        let group;

        if(search_value !== 'All') {
            switch (search_type) {
                case 'organization':
                    match =  { organization_id: search_value, ...match };
                    group =  { _id: '$organization_id' };
                    break;

                case 'location':
                    match =  { location_id: search_value, ...match };
                    group =  { _id: '$location_id' };
                    break;

                case 'department':
                    match =  { department_id: search_value, ...match };
                    group =  { _id: '$department_id' };
                    break;

                case 'employee':
                    match =  { employee_id: search_value, ...match };
                    group =  { _id: '$employee_id' };
                    break;
            }
        }

        else {
            match = { organization_id, ...match };

            switch (search_type) {
                case 'location':
                    group =  { _id: '$location_id' };
                    break;

                case 'department':
                    group =  { _id: '$department_id' };
                    break;

                case 'employee':
                    group =  { _id: '$employee_id' };
                    break;
            }
        }

        // return EmpProductivityReportsModel.aggregate([
        //     { $match: match },
        //     { $group: group },
        //     { $skip: startIndex },
        //     { $limit: limit },
        //     // { $project: { _id: 0 } }
        // ]);
        return EmpProductivityReportsModel.aggregate([
            { $match: match },
            { $group: group },
            { $count: "total" }
        ]);
    }
    getProductivityList({organization_id, search_type, search_value, startIndex, limit, startDate, endDate}) {
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };
        let group = {
            productive_duration: { $sum: '$productive_duration' },
            non_productive_duration: { $sum: '$non_productive_duration' },
            neutral_duration: { $sum: '$neutral_duration' }
        }

        if(search_value !== 'All') {
            switch (search_type) {
                case 'organization':
                    match =  { organization_id: search_value, ...match };
                    group =  { _id: '$organization_id', organization_id: { $first: '$organization_id' }, ...group };
                    break;

                case 'location':
                    match =  { location_id: search_value, ...match };
                    group =  { _id: '$location_id', location_id: { $first: '$location_id' }, ...group };
                    break;

                case 'department':
                    match =  { department_id: search_value, ...match };
                    group =  { _id: '$department_id', department_id: { $first: '$department_id' }, ...group };
                    break;

                case 'employee':
                    match =  { employee_id: search_value, ...match };
                    group =  { _id: '$employee_id', employee_id: { $first: '$employee_id' }, ...group };
                    break;
            }
        }

        else {
            match = { organization_id, ...match };

            switch (search_type) {
                case 'location':
                    group =  { _id: '$location_id', location_id: { $first: '$location_id' }, ...group };
                    break;

                case 'department':
                    group =  { _id: '$department_id', department_id: { $first: '$department_id' }, ...group };
                    break;

                case 'employee':
                    group =  { _id: '$employee_id', employee_id: { $first: '$employee_id' }, ...group };
                    break;
            }
        }

        return EmpProductivityReportsModel.aggregate([
            { $match: match },
            { $group: group },
            { $skip: startIndex },
            { $limit: limit },
            // { $project: { _id: 0 } }
        ]);
    }
    getNames({ids, search_type}) {
        let table = 'admin';

        switch (search_type) {
            case 'location':
                table = 'location';
                break;

            case 'department':
                table = 'department';
                break;

            case 'employee':
                table = 'users';
                break;
        }

        const query = `
            SELECT id, name
            FROM ${table}
            WHERE id IN (${ids.toString()});
        `;

        return mySql.query(query);
    }

    getEmployeeNames(employee_ids) {
        const query = `
            SELECT id, name
            FROM users
            WHERE id IN (${employee_ids.toString()});
        `;

        return mySql.query(query);
    }
    getLocationNames(location_ids) {
        const query = `
            SELECT id, name
            FROM location
            WHERE id IN (${location_ids.toString()});
        `;

        return mySql.query(query);
    }
}

module.exports = new PrModel;

// const startDate = "2020-04-10"
// const endDate = "2020-04-11"
// EmpProductivityReportsModel.aggregate([
//     {
//         $match: {
//             organization_id: 7,
//             yyyymmdd: {
//                 $gte: parseInt(startDate.split('-').join('')),
//                 $lte: parseInt(endDate.split('-').join(''))
//             }
//         }
//     },
//     {
//         $group: {
//             _id: '$location_id',
//             location_id: { $first: '$location_id' },
//             productive_duration: { $sum: '$productive_duration' },
//             non_productive_duration: { $sum: '$non_productive_duration' },
//             neutral_duration: { $sum: '$neutral_duration' }
//         }
//     },
//     { $project: { _id: 0 } }
// ], (err, results) => {
//     console.log(err)
//     console.log(results)
// })

// const Common = require('../../../utils/helpers/Common');
// EmpProductivityReportsModel.aggregate([
//     {
//         $match: {
//             department_id: 1
//         }
//     },
//     {
//         $group: {
//             _id: { department_id: '$department_id', yyyymmdd: '$yyyymmdd' },
//             applications: { $push: '$applications' }
//         }
//     }
// ], (err, results) => {
//     console.log(err);
//     console.log(results[1]);

//     const asd = results.map(result => {
//         const date = Common.yyyymmdd_to_yyyy_mm_dd(result._id.yyyymmdd);
//         console.log(result.applications)
//         return date;
//     });
//     console.log(asd);
// })