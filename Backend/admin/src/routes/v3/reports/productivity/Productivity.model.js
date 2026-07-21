const mySql = require('../../../../database/MySqlConnection').getInstance();
const EmpProductivityReportsModel = require('../../../../models/employee_productivity.schema');
const moment = require('moment');
const { TaskSchemaModel } = require("../../../../models/silah_db.schema");

const productivityFormula = (organization_id, productive_hours) => {
    return process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) ?
        { '$multiply': [30600, '$count'] } :
        (productive_hours ? { '$multiply': [productive_hours, '$count'] } : {
            $sum: [
                '$non_productive_duration',
                '$productive_duration',
                '$neutral_duration',
                '$break_duration',
                '$idle_duration'
            ]
        })
}

class PrModel {
    getProductivity({ search_type, search_value, startDate, endDate, employee_ids }) {
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
            neutral_duration: { $sum: '$neutral_duration' },
            idle_duration: { $sum: '$idle_duration' },
            break_duration: { $sum: '$ break_duration' },
            offline_time: { $sum: '$offline_time' },
            count: { $sum: 1 }
        };

        switch (search_type) {
            case "employee_id":
                match = { employee_id: { $in: search_value }, ...match };
                group = { _id: { employee_id: "$employee_id", yyyymmdd: "$yyyymmdd" }, ...group };
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
        if (employee_ids) {
            match = { employee_id: { $in: employee_ids }, ...match };
        }

        if (search_type === "employee_id") return EmpProductivityReportsModel.aggregate([{ $match: match }, { $sort: { yyyymmdd: -1 } }, { $group: group }]);
        return EmpProductivityReportsModel.aggregate([{ $match: match }, { $sort: { yyyymmdd: -1 } }, { $group: group }]);
    }

    getProductivityListCount({ organization_id, search_type, search_value, startDate, endDate, employee_ids }) {
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };
        let group;

        if (search_value !== 'All') {
            switch (search_type) {
                case 'organization':
                    match = { organization_id: search_value, ...match };
                    group = { _id: '$organization_id' };
                    break;

                case 'location':
                    match = { location_id: search_value, ...match };
                    group = { _id: '$location_id' };
                    break;

                case 'department':
                    match = { department_id: search_value, ...match };
                    group = { _id: '$department_id' };
                    break;

                case 'employee':
                    match = { employee_id: { $in: search_value }, ...match };
                    group = { _id: '$employee_id' };
                    break;
            }
        }

        else {
            match = { organization_id, ...match };

            switch (search_type) {
                case 'location':
                    group = { _id: '$location_id' };
                    break;

                case 'department':
                    group = { _id: '$department_id' };
                    break;

                case 'employee':
                    group = { _id: '$employee_id' };
                    break;
            }
        }
        if (employee_ids) {
            match = { employee_id: { $in: employee_ids }, ...match };
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
    getProductivityList({ organization_id, search_type, search_value, startIndex, limit, startDate, endDate, employee_ids, order, column, tempIds, productive_hours }) {
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };
        let group = {
            productive_duration: { $sum: '$productive_duration' },
            non_productive_duration: { $sum: '$non_productive_duration' },
            neutral_duration: { $sum: '$neutral_duration' },
            idle_duration: { $sum: '$idle_duration' },
            break_duration: { $sum: '$break_duration' },
            office_time: {
                $sum: {
                    $add: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration', '$offline_time']
                }
            },
            computer_activities_time: {
                $sum: {
                    $add: ['$non_productive_duration', '$productive_duration', '$neutral_duration']
                }
            },
            count: { $sum: 1 }
        }
        //    const isSpecialOrg= process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) 
        let project = {
            productivity: {
                $round: [{
                    $multiply: [
                        {
                            $divide: [
                                '$productive_duration',
                                // process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) ? { '$multiply': [30600, '$count'] } : { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration'] }
                                productivityFormula(organization_id, productive_hours)
                            ]
                        }, 100]
                }, 2]
            },
            unproductivity: {
                $round: [{
                    $multiply: [
                        {
                            $divide: [
                                '$non_productive_duration',
                                // process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) ? { '$multiply': [30600, '$count'] } : { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration'] }
                                productivityFormula(organization_id, productive_hours)
                            ]
                        }, 100]
                }, 2
                ],
            },
            productive_duration: 1,
            non_productive_duration: 1,
            neutral_duration: 1,
            break_duration: 1,
            idle_duration: 1,
            office_time: 1,
            computer_activities_time: 1,
            count: 1
        }

        if (employee_ids) {
            match = { employee_id: { $in: employee_ids }, ...match };
        }

        if (search_value !== 'All') {
            switch (search_type) {
                case 'organization':
                    match = { organization_id: search_value, ...match };
                    group = { _id: '$organization_id', organization_id: { $first: '$organization_id' }, ...group };
                    break;

                case 'location':
                    match = { location_id: search_value, ...match };
                    group = { _id: '$location_id', location_id: { $first: '$location_id' }, ...group };
                    break;

                case 'department':
                    match = { department_id: search_value, ...match };
                    group = { _id: '$department_id', department_id: { $first: '$department_id' }, ...group };
                    break;

                case 'employee':
                    match = { employee_id: { $in: search_value }, ...match };
                    // match = { employee_id: search_value, ...match };
                    group = { _id: '$employee_id', employee_id: { $first: '$employee_id' }, ...group };
                    break;
            }
        } else {
            match = { organization_id, ...match };

            switch (search_type) {
                case 'location':
                    group = { _id: '$location_id', location_id: { $first: '$location_id' }, ...group };
                    if (tempIds.length > 0) match = { location_id: { $in: tempIds } };
                    break;

                case 'department':
                    group = { _id: '$department_id', department_id: { $first: '$department_id' }, ...group };
                    if (tempIds.length > 0) match = { department_id: { $in: tempIds } };
                    break;

                case 'employee':
                    group = { _id: '$employee_id', employee_id: { $first: '$employee_id' }, ...group };
                    if (tempIds.length > 0) match = { employee_id: { $in: tempIds } };
                    break;
            }
        }


        let query = [{ $match: match }, { $group: group }, { $project: project }];
        if (column) query.push({ $sort: { [column]: order === 'DESC' ? -1 : 1 } },);
        query.push({ $skip: startIndex }, { $limit: limit },);

        return EmpProductivityReportsModel.aggregate(query);
        // return EmpProductivityReportsModel.aggregate([
        //     { $match: match },
        //     { $group: group },
        //     { $skip: startIndex },
        //     { $limit: limit },
        //     // { $project: { _id: 0 } }
        // ]);
    }

    getProductivityListForDownload({ organization_id, search_type, search_value, startDate, endDate, employee_ids, productive_hours }) {
        let match = {
            yyyymmdd: {
                $gte: parseInt(startDate.split('-').join('')),
                $lte: parseInt(endDate.split('-').join(''))
            }
        };
        let group = {
            productive_duration: { $sum: '$productive_duration' },
            non_productive_duration: { $sum: '$non_productive_duration' },
            neutral_duration: { $sum: '$neutral_duration' },
            idle_duration: { $sum: '$idle_duration' },
            break_duration: { $sum: '$break_duration' },
            office_time: {
                $sum: {
                    $add: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration', '$offline_time']
                }
            },
            computer_activities_time: {
                $sum: {
                    $add: ['$non_productive_duration', '$productive_duration', '$neutral_duration']
                }
            },
            count: { $sum: 1 }
        }

        let project = {
            productivity: {
                $round: [{
                    $multiply: [
                        {
                            $divide: [
                                '$productive_duration',
                                // process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) ? { '$multiply': [30600, '$count'] } : { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration'] }
                                productivityFormula(organization_id, productive_hours)
                            ]
                        }, 100]
                }, 2]
            },
            unproductivity: {
                $round: [{
                    $multiply: [
                        {
                            $divide: [
                                '$non_productive_duration',
                                // process.env.ORGANIZATION_ID.split(',').includes(organization_id.toString()) ? { '$multiply': [30600, '$count'] } : { $sum: ['$non_productive_duration', '$productive_duration', '$neutral_duration', '$break_duration', '$idle_duration'] }
                                productivityFormula(organization_id, productive_hours)
                            ]
                        }, 100]
                }, 2]
            },
            productive_duration: 1,
            non_productive_duration: 1,
            neutral_duration: 1,
            break_duration: 1,
            idle_duration: 1,
            office_time: 1,
            computer_activities_time: 1,
            count: 1
        }
        if (employee_ids) {
            match = { employee_id: { $in: employee_ids }, ...match };
        }

        if (search_value !== 'All') {
            switch (search_type) {
                case 'organization':
                    match = { organization_id: search_value, ...match };
                    group = { _id: '$organization_id', organization_id: { $first: '$organization_id' }, ...group };
                    break;

                case 'location':
                    match = { location_id: search_value, ...match };
                    group = { _id: '$location_id', location_id: { $first: '$location_id' }, ...group };
                    break;

                case 'department':
                    match = { department_id: search_value, ...match };
                    group = { _id: '$department_id', department_id: { $first: '$department_id' }, ...group };
                    break;

                case 'employee':
                    match = { employee_id: { $in: search_value }, ...match };
                    group = { _id: '$employee_id', employee_id: { $first: '$employee_id' }, ...group };
                    break;
            }
        } else {
            match = { organization_id, ...match };

            switch (search_type) {
                case 'location':
                    group = { _id: '$location_id', location_id: { $first: '$location_id' }, ...group };
                    break;

                case 'department':
                    group = { _id: '$department_id', department_id: { $first: '$department_id' }, ...group };
                    break;

                case 'employee':
                    group = { _id: '$employee_id', employee_id: { $first: '$employee_id' }, ...group };
                    break;
            }
        }

        let query = [{ $match: match }, { $group: group }, { $project: project }];
        return EmpProductivityReportsModel.aggregate(query);
    }

    getNames({ ids, search_type, startIndex, limit, name, search_value, organization_id, employee_ids, order, endDate, startDate }) {
        let query;
        switch (search_type) {
            case 'location':
                query = `SELECT id, name FROM organization_locations WHERE id IN (${ids.toString()});`
                if (name) {
                    query = `SELECT id, name,(COUNT(id ) OVER()) AS total
                    FROM organization_locations
                    WHERE organization_id=${organization_id}`;
                    if (search_value !== 'All') query += ` AND id=${search_value}`

                    query += ` ORDER BY name ${order}`
                    query += ` LIMIT ${startIndex},${limit};`;
                }

                break;

            case 'department':
                query = `SELECT id, name FROM organization_departments WHERE id IN (${ids.toString()});`
                if (name) {
                    query = `SELECT id, name,(COUNT(id ) OVER()) AS total
                    FROM organization_departments 
                    WHERE organization_id=${organization_id}`
                    if (search_value !== 'All') query += ` AND id=${search_value}`

                    query += ` ORDER BY name ${order}`
                    query += ` LIMIT ${startIndex},${limit};`;

                }
                break;

            case 'employee':
                query = `
                    SELECT e.id, CONCAT(u.first_name, ' ', u.last_name) AS name
                    FROM employees as e
                    LEFT JOIN users AS u ON u.id = e.user_id
                    WHERE e.id IN (${ids.toString()});
                `
                if (name) {
                    query = `
                    SELECT e.id, CONCAT(u.first_name, ' ', u.last_name) AS name,ea.date, (COUNT(e.id ) OVER()) AS total
                    FROM employees as e
                    LEFT JOIN users AS u ON u.id = e.user_id
                    INNER JOIN employee_attendance ea ON ea.employee_id=e.id
                    WHERE e.organization_id=${organization_id} AND ea.date BETWEEN '${startDate}' AND '${endDate}'`


                    if (search_value !== 'All') {
                        query += ` AND e.id IN (${search_value})`
                    } else {
                        if (employee_ids) query += ` AND e.id IN (${employee_ids.toString()})`
                    }
                    query += ` GROUP BY e.id`
                    query += ` ORDER BY u.first_name ${order}`
                    query += ` LIMIT ${startIndex},${limit};`;

                }
                break;

            default:
                query = `
                    SELECT id, CONCAT(first_name, ' ', last_name) AS name
                    FROM users
                    WHERE id IN (${ids.toString()});
                `;
                break;
        }
        return mySql.query(query);
    }

    getEmployeeAssignedToManager(manager_id, role_id) {
        let query = `
            SELECT employee_id
            FROM assigned_employees
            WHERE to_assigned_id=${manager_id}
        `;
        if (role_id) query += ` AND role_id=${role_id}`;
        return mySql.query(query);
    }

    getEmployeeIds(role_id, shift_id, organization_id) {

        let query = ` SELECT e.id AS employee_id
                       FROM employees as e
                       WHERE e.organization_id=${organization_id} `

        if (shift_id) {
            query += ` AND e.shift_id IN (${shift_id}) `
        }
        query += ` UNION SELECT employee_id 
        FROM assigned_employees ase
        INNER JOIN employees AS e ON e.id=ase.employee_id
        WHERE ase.role_id IN (${role_id}) AND e.organization_id=${organization_id}`
        return mySql.query(query);
    }

    async getProductivityPercentageModel(organization_id, startDate, endDate, location_id, department_id, employee_ids, limit, skip, sortColumn, sortOrder) {

        let query = [];
        let match = {
            organization_id: { $eq: organization_id }
        };
        if (employee_ids) {
            match = { employee_id: { $in: employee_ids }, ...match };
        }
        if (department_id) {
            match = { department_id: { $in: department_id }, ...match };
        }
        if (location_id) {
            match = { location_id: { $in: location_id }, ...match };
        }
        if (startDate) {
            match = { date: { $gte: startDate, $lte: endDate }, ...match };
        }

        query.push({ $match: match },)
        query.push({
            $lookup: {
                from: 'conversation_classifications',
                let: {
                    employee_id: "$employee_id",
                    startdate: startDate,
                    enddate: endDate
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ["$employee_id", "$$employee_id"] },
                                    { $gte: ["$date", "$$startdate"] },
                                    { $lte: ["$date", "$$enddate"] }
                                ]
                            }
                        }
                    },
                ], as: 'data'
            }
        })

        query.push({ $group: { _id: { employee_id: "$employee_id" }, logged_duration: { $sum: "$logged_duration" }, productive_duration: { $sum: "$productive_duration" }, idle_duration: { $sum: "$idle_duration" }, break_duration: { $sum: "$break_duration" }, non_productive_duration: { $sum: "$non_productive_duration" }, neutral_duration: { $sum: "$neutral_duration" }, department_id: { $first: "$department_id" }, date: { $first: "$date" }, offensive_percentage: { $sum: "$data.prediction" } } },)

        query.push({ $sort: { sort: sortOrder } },)
        if (limit) {
            query.push({ $limit: limit },)
        }
        if (skip) {
            query.push({ $skip: skip })
        }
        return EmpProductivityReportsModel.aggregate(query)
    }

    getEmployeeAssignedNonAdminId (employee_id, nonAdminId) {
        let query = `
            SELECT employee_id
            FROM assigned_employees
            WHERE to_assigned_id=${nonAdminId} AND employee_id=${employee_id}
        `;
        return mySql.query(query);
    }

    getEmployeeProductivityData(organization_id, location_id, department_id, employee_id, startDate, endDate, skip, limit, employee_ids, Manager_ID) {
        startDate = moment(startDate).format('YYYY-MM-DD');
        endDate = moment(endDate).format('YYYY-MM-DD');

        let matchingObj = {
            organization_id: organization_id,
            yyyymmdd: { $gte: +startDate.split("-").join(''), $lte: +endDate.split("-").join('') }, 
        }
        if(employee_ids.length && !employee_id) matchingObj.employee_id = { $in: employee_ids};
        if(Manager_ID && !employee_id && employee_ids.length === 0) matchingObj.employee_id = { $in: []}

        let query = [
            {
                $match: matchingObj
            }
        ]
        if (location_id !== "All" && !department_id && !employee_id) {
            query.push({
                $match: {
                    location_id: location_id
                }
            })
            query.push({
                $group: {
                    _id: "$department_id",
                    "productive_duration": { "$sum": "$productive_duration" },
                    "non_productive_duration": { "$sum": "$non_productive_duration" },
                    "neutral_duration": { "$sum": "$neutral_duration" },
                    "idle_duration": { "$sum": "$idle_duration" },
                    "total_logged_duration": { "$sum": "$logged_duration" },
                    "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                    "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                    "count": { "$sum":1 }
                }
            })
        }
        if (location_id !== "All" && department_id && !employee_id) {
            query.push({
                $match: {
                    location_id: location_id,
                    department_id: department_id,
                }
            })
            query.push({
                $group: {
                    _id: "$employee_id",
                    "productive_duration": { "$sum": "$productive_duration" },
                    "non_productive_duration": { "$sum": "$non_productive_duration" },
                    "total_logged_duration": { "$sum": "$logged_duration" },
                    "neutral_duration": { "$sum": "$neutral_duration" },
                    "idle_duration": { "$sum": "$idle_duration" },
                    "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                    "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                    "count": { "$sum":1 }
                }
            })
        }
        if (location_id !== "All" && department_id && employee_id) {
            query.push({
                $match: {
                    location_id: location_id,
                    department_id: department_id,
                    employee_id: employee_id,
                }
            })
            query.push({
                $group: {
                    _id: "$yyyymmdd",
                    "employee_id": { "$first": "$employee_id" },
                    "date": { "$first": "$date" },
                    "productive_duration": { "$sum": "$productive_duration" },
                    "total_logged_duration": { "$sum": "$logged_duration" },
                    "non_productive_duration": { "$sum": "$non_productive_duration" },
                    "neutral_duration": { "$sum": "$neutral_duration" },
                    "idle_duration": { "$sum": "$idle_duration" },
                    "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                    "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                    "count": { "$sum":1 }
                }
            })
        }
        if (location_id == "All") query.push({
            $group: {
                _id: "$location_id",
                "productive_duration": { "$sum": "$productive_duration" },
                "non_productive_duration": { "$sum": "$non_productive_duration" },
                "neutral_duration": { "$sum": "$neutral_duration" },
                "total_logged_duration": { "$sum": "$logged_duration" },
                "idle_duration": { "$sum": "$idle_duration" },
                "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                "count": { "$sum":1 }
            }
        })
        query.push({ $sort: { "date": 1 } });
        if((skip || skip == 0) && limit) query.push({ "$limit": skip + limit },{ "$skip": skip });
        return EmpProductivityReportsModel.aggregate(query);
    }

    getEmployeeProductivityDataCount(organization_id, location_id, department_id, employee_id, startDate, endDate, employee_ids, Manager_ID) {

        startDate = moment(startDate).format('YYYY-MM-DD');
        endDate = moment(endDate).format('YYYY-MM-DD');

        let matchingObj = {
            organization_id: organization_id,
            yyyymmdd: { $gte: +startDate.split("-").join(''), $lte: +endDate.split("-").join('') }, 
        }
        
        if(employee_ids.length && !employee_id) matchingObj.employee_id = { $in: employee_ids};
        if(Manager_ID && !employee_id && employee_ids.length === 0) matchingObj.employee_id = { $in: []};

        let query = [
            {
                $match: matchingObj
            }
        ]
        if (location_id !== "All" && !department_id && !employee_id) {
            query.push({
                $match: {
                    location_id: location_id
                }
            })
            query.push({
                $group: {
                    _id: "$department_id",
                    "productive_duration": { "$sum": "$productive_duration" },
                    "non_productive_duration": { "$sum": "$non_productive_duration" },
                    "total_logged_duration": { "$sum": "$logged_duration" },
                    "neutral_duration": { "$sum": "$neutral_duration" },
                    "idle_duration": { "$sum": "$idle_duration" },
                    "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                    "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                    "count": { "$sum":1 }
                }
            })
        }
        if (location_id !== "All" && department_id && !employee_id) {
            query.push({
                $match: {
                    location_id: location_id,
                    department_id: department_id,
                }
            })
            query.push({
                $group: {
                    _id: "$employee_id",
                    "productive_duration": { "$sum": "$productive_duration" },
                    "non_productive_duration": { "$sum": "$non_productive_duration" },
                    "total_logged_duration": { "$sum": "$logged_duration" },
                    "neutral_duration": { "$sum": "$neutral_duration" },
                    "idle_duration": { "$sum": "$idle_duration" },
                    "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                    "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                    "count": { "$sum":1 }
                }
            })
        }
        if (location_id !== "All" && department_id && employee_id) {
            query.push({
                $match: {
                    location_id: location_id,
                    department_id: department_id,
                    employee_id: employee_id,
                }
            })
            query.push({
                $group: {
                    _id: "$yyyymmdd",
                    "employee_id": { "$first": "$employee_id" },
                    "date": { "$first": "$date" },
                    "non_productive_duration": { "$sum": "$non_productive_duration" },
                    "total_logged_duration": { "$sum": "$logged_duration" },
                    "neutral_duration": { "$sum": "$neutral_duration" },
                    "idle_duration": { "$sum": "$idle_duration" },
                    "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                    "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                    "count": { "$sum":1 }
                }
            })
        }
        if (location_id == "All") query.push({
            $group: {
                _id: "$location_id",
                "productive_duration": { "$sum": "$productive_duration" },
                "non_productive_duration": { "$sum": "$non_productive_duration" },
                "total_logged_duration": { "$sum": "$logged_duration" },
                "neutral_duration": { "$sum": "$neutral_duration" },
                "idle_duration": { "$sum": "$idle_duration" },
                "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                "count": { "$sum":1 }
            }
        })

        query.push({ $group: { _id: null, myCount: { $sum: 1 } } });
        return EmpProductivityReportsModel.aggregate(query)
    }

    getLocationData(_location_id, organization_id) {
        let query = ` SELECT  ol.name, ol.id
            FROM organization_locations ol
            WHERE ol.organization_id = ${organization_id} AND ol.id IN (${_location_id})
        `;
        return mySql.query(query);
    }

    getDepartmentData(_department_id, organization_id) {
        let query = ` SELECT  od.name, od.id
            FROM organization_departments od
            WHERE od.organization_id = ${organization_id} AND od.id IN (${_department_id})
        `;
        return mySql.query(query);
    }

    getEmployeeData(_employee_id, organization_id) {
        let query = ` 
            SELECT e.id, concat(u.first_name, ' ', u.last_name) as name, u.computer_name, u.username
            FROM employees e
            JOIN users u ON u.id = e.user_id
            WHERE e.organization_id = ${organization_id} AND e.id IN (${_employee_id})
        `;
        return mySql.query(query);
    }

    getEmployeeTimezone(employee_id, organization_id) {
        let query = `
            SELECT e.id, e.timezone
                FROM employees e 
                WHERE e.organization_id = ${organization_id} AND e.id = ${employee_id}
        `;
        return mySql.query(query);
    }

    getEmployeeMobileUsage (employee_id, organization_id, start_date, end_date) {
        return TaskSchemaModel.aggregate([
            {
                $match: {
                    "$or": [
                        {
                            "task_working_status.start_time": { $gte: new Date(start_date), $lte: new Date(end_date) }
                        },
                        {
                            "task_working_status.end_time": { $gte: new Date(start_date), $lte: new Date(end_date) }
                        }
                    ],
                    assigned_user: +employee_id,
                    status: { $ne: 0},
                    organization_id: organization_id
                }
            }
        ])
    }

    getEmployeeProductivityDataAll(organization_id, startDate, endDate, specificEmployeeId) {
        startDate = moment(startDate).format('YYYY-MM-DD');
        endDate = moment(endDate).format('YYYY-MM-DD');
        let matchingObj = {
            organization_id: organization_id,
            yyyymmdd: { $gte: +startDate.split("-").join(''), $lte: +endDate.split("-").join('') }, 
        }
        if(specificEmployeeId.length) matchingObj.employee_id = { $in: specificEmployeeId};
        let query = [
            {
                $match: matchingObj
            }
        ]
        query.push({
            $group: {
                _id: "$employee_id",
                "productive_duration": { "$sum": "$productive_duration" },
                "non_productive_duration": { "$sum": "$non_productive_duration" },
                "neutral_duration": { "$sum": "$neutral_duration" },
                "total_logged_duration": { "$sum": "$logged_duration" },
                "idle_duration": { "$sum": "$idle_duration" },
                "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                "count": { "$sum":1 }
            }
        })
        query.push({ $sort: { "date": 1 }});
        return EmpProductivityReportsModel.aggregate(query);
    }
    
    getEmployeeProductivityDataCountAll(organization_id, startDate, endDate, specificEmployeeId) {
        startDate = moment(startDate).format('YYYY-MM-DD');
        endDate = moment(endDate).format('YYYY-MM-DD');
        let matchingObj = {
            organization_id: organization_id,
            yyyymmdd: { $gte: +startDate.split("-").join(''), $lte: +endDate.split("-").join('') }, 
        }
        if(specificEmployeeId.length) matchingObj.employee_id = { $in: specificEmployeeId};
        let query = [
            {
                $match: matchingObj
            }
        ]
        query.push({
            $group: {
                _id: "$employee_id",
                "productive_duration": { "$sum": "$productive_duration" },
                "non_productive_duration": { "$sum": "$non_productive_duration" },
                "neutral_duration": { "$sum": "$neutral_duration" },
                "total_logged_duration": { "$sum": "$logged_duration" },
                "idle_duration": { "$sum": "$idle_duration" },
                "office_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration", "$idle_duration"] } },
                "computer_activities_time": { "$sum": { "$add": ["$productive_duration", "$non_productive_duration", "$neutral_duration"] } },
                "count": { "$sum":1 }
            }
        })
        query.push({ $group: { _id: null, myCount: { $sum: 1 } } });
        return EmpProductivityReportsModel.aggregate(query);
    }

}

module.exports = new PrModel;



// SELECT e.id, CONCAT(u.first_name, ' ', u.last_name) AS name, (COUNT(e.id) OVER()) AS total
// FROM employees as e
// LEFT JOIN users AS u ON u.id = e.user_id
// WHERE organization_id = ${ organization_id } `
