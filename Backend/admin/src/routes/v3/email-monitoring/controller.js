const EmailMonitoringValidation = require('./validation');
const EmailMonitoringModel = require('./model');
const S3Utils = require('../../../utils/helpers/S3Utils');
const UserActivityModel = require('../useractivity/useractivity.model');
const _ = require('underscore');
const moment = require('moment');

class EmailMonitoringController {
    async getEmailMonitoring(req, res, next) {
        try {
            let { organization_id } = req.decoded;

            let { employee_id, skip = 0, limit = 10, start_date, end_date, search, type, department_id, location_id } = await EmailMonitoringValidation.getEmailMonitoring().validateAsync(req.query);
            if(skip) skip = +skip;
            if(limit) limit = +limit;
            start_date = start_date ? moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD') : null;
            end_date = end_date ? moment(end_date, 'DD-MM-YYYY').add(1, 'day').format('YYYY-MM-DD') : null;
            let employee_ids = [];
            if(department_id && !location_id) {
                employee_ids = _.pluck(await EmailMonitoringModel.getEmployeeIdsByDepartment(organization_id, department_id), 'id');
                if(!employee_ids.length) {
                    return res.status(404).json({
                        code: 404,
                        data: null,
                        error: { message: 'No employee data found with given filter.' },
                        message: 'No employee data found with given filter.'
                    });
                }
            }
            if(location_id && !department_id) {
                employee_ids = _.pluck(await EmailMonitoringModel.getEmployeeIdsByLocation(organization_id, location_id), 'id');
                if(!employee_ids.length) {
                    return res.status(404).json({
                        code: 404,
                        data: null,
                        error: { message: 'No employee data found with given filter.' },
                        message: 'No employee data found with given filter.'
                    });
                }
            }

            if(department_id && location_id) {
                employee_ids = _.pluck(await EmailMonitoringModel.getEmployeeIdsByDepartmentAndLocation(organization_id, department_id, location_id), 'id');
                if(!employee_ids.length) {
                    return res.status(404).json({
                        code: 404,
                        data: null,
                        error: { message: 'No employee data found with given filter.' },
                        message: 'No employee data found with given filter.'
                    });
                }
            }

            let [email_monitoring, email_monitoring_count] = await Promise.all([
                EmailMonitoringModel.getEmailMonitoring(organization_id, employee_ids, employee_id, start_date, end_date, search, type, skip, limit),
                EmailMonitoringModel.getEmailMonitoringCount(organization_id, employee_ids, employee_id, start_date, end_date, search, type)
            ]);

            let employeeIds = _.pluck(email_monitoring, 'employee_id');
            let employeeDetails = await EmailMonitoringModel.getEmployeeDetails(organization_id, employeeIds);


            // Generate temporary public (signed) URLs for email attachments on read.
            // Supports multiple storage providers. For S3 we generate signed URLs;
            // for other providers we return the stored public URL as-is.
            const [credsData] = await UserActivityModel.getStorageDetail(organization_id);
            const storageType = credsData ? credsData.short_code : null;
            const s3Creds = storageType === 'S3' && credsData && credsData.creds ? JSON.parse(credsData.creds) : null;

            email_monitoring = email_monitoring.map(item => {
                item.employee_details = employeeDetails.find(employee => employee.id === item.employee_id);
                if ((item.type === 0 || item.type === 4) && item.log_data && Array.isArray(item.log_data.attachments) && item.log_data.attachments.length > 0) {
                    item.log_data.attachments = item.log_data.attachments.map(attachment => {
                        const originalLink = attachment.link || '';

                        // If we already have a signed/public URL that is not S3, just return it.
                        if (originalLink.startsWith('http') && !originalLink.includes('amazonaws.com')) {
                            return {
                                name: attachment.name,
                                link: originalLink,
                            };
                        }

                        // For non-S3 storages (GD, MO, FTP, etc.), return the stored value as-is.
                        if (storageType !== 'S3' || !s3Creds) {
                            return {
                                name: attachment.name,
                                link: originalLink,
                            };
                        }

                        // For S3 URLs or keys, generate a temporary signed URL using S3Utils and DB creds.
                        let signedLink = originalLink;
                        try {
                            // Expecting the stored link to contain the key (or full S3 URL).
                            // S3Utils will use DB creds and generate a pre‑signed URL.
                            const key = originalLink.replace(/^https?:\/\/[^/]+\//, '');
                            const { s3, setParams } = S3Utils.initConection(s3Creds);

                            const getLinkParams = setParams({
                                Key: key,
                                Expires: 7 * 24 * 60 * 60, // 7 days
                            });
                            signedLink = s3.getSignedUrl('getObject', getLinkParams);
                        } catch (e) {
                            // fallback to original link if signing fails
                            signedLink = originalLink;
                        }

                        return {
                            name: attachment.name,
                            link: signedLink,
                        };
                    });
                }
                return item;
            });

            return res.status(200).json({ code: 200, message: "Email monitoring fetched successfully.", data: { email_monitoring, email_monitoring_count } });
        } catch (error) {
            next(error);
        }
    }
}



module.exports = new EmailMonitoringController();