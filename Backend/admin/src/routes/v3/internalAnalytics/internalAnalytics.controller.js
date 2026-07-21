const moment = require('moment');
const Model = require('./internalAnalytics.model');

class InternalAnalytics {

    async getAutoEmailReportConcise(req, res, next) {
        try {
            let currentDate = moment().utc().subtract(1, 'day').format('YYYY-MM-DD');
            let [data, [dataCount]] = await Promise.all([Model.getAutoEmailReportConcise(currentDate), Model.getAutoEmailReportCount(currentDate)]);
            return res.json({
                code: 200,
                data: {
                    email: data,
                    count: dataCount.total_count
                },
                message: 'Auto Email Report Concise.',
                error: null
            })
        }
        catch (error) {
            next(error);
        }
    }

    async getAlertReportConcise(req, res, next) {
        try {
            let currentDate = moment().utc().subtract(1, 'day').format('YYYY-MM-DD');
            let [data, [dataCount]] = await Promise.all([Model.getAlertReportConcise(currentDate), Model.getAlertReportCount(currentDate)]);
            return res.json({
                code: 200,
                data: {
                    alert: data,
                    count: dataCount.total_count
                },
                message: 'Alert Report Concise.',
                error: null
            })
        } catch (error) {
            next(error);
        }
    }

    async getSystemLogsReport(req, res, next) {
        try {
            const { organization_id, employee_id, limit, skip } = req.query;
            
            // Parse limit and skip
            const parsedLimit = limit ? parseInt(limit) : 100;
            const parsedSkip = skip ? parseInt(skip) : 0;

            // Fetch logs and count in parallel
            const [logs, totalCount] = await Promise.all([
                Model.getSystemLogs({
                    organization_id: organization_id ? parseInt(organization_id) : null,
                    employee_id: employee_id ? parseInt(employee_id) : null,
                    limit: parsedLimit,
                    skip: parsedSkip
                }),
                Model.getSystemLogsCount({
                    organization_id: organization_id ? parseInt(organization_id) : null,
                    employee_id: employee_id ? parseInt(employee_id) : null
                })
            ]);

            // Extract unique employee IDs from logs
            const employeeIds = [...new Set(logs.map(log => log.employee_id).filter(id => id))];

            // Fetch employee details from MySQL
            let employeeDetails = [];
            if (employeeIds.length > 0) {
                employeeDetails = await Model.getEmployeesByIds(employeeIds);
            }

            // Create a map for quick employee lookup
            const employeeMap = {};
            employeeDetails.forEach(emp => {
                employeeMap[emp.id] = emp;
            });

            // Combine logs with employee details
            const combinedData = logs.map(log => ({
                _id: log._id,
                employee_id: log.employee_id,
                organization_id: log.organization_id,
                log_data: log.log_data,
                createdAt: log.createdAt,
                updatedAt: log.updatedAt,
                employee_details: log.employee_id ? employeeMap[log.employee_id] || null : null
            }));

            return res.json({
                code: 200,
                data: {
                    logs: combinedData,
                    pagination: {
                        total: totalCount,
                        limit: parsedLimit,
                        skip: parsedSkip,
                        hasMore: parsedSkip + parsedLimit < totalCount
                    }
                },
                message: 'System logs fetched successfully.',
                error: null
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new InternalAnalytics();