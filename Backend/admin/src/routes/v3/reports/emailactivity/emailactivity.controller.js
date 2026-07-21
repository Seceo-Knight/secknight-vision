const _ = require('underscore');
const moment = require('moment');

const EmailValidator = require('./emailactivity.validator');
const EmailModel = require('./emailactivity.model');
const { sendResponse } = require('../../../../utils/myService')

class EmailActivity {

    async getUnicClients(req, res) {
        try {
            const organization_id = req.decoded.organization_id;
            const unicClients = await EmailModel.unicClients(organization_id);

            return sendResponse(res, 200, unicClients, 'Client types', null);
        } catch (err) {
            next(err);
        }
    }

    async emailDataGraph(req, res, next) {
        try {
            const { organization_id, role_id } = req.decoded;
            const { department_id, employee_id, client_type, location_id, startDate, endDate } = await EmailValidator.emailContentGraph().validateAsync(req.query);
            const manager_id = req.decoded.employee_id || null;
            let employee_ids = null;

            let dates = [];
            let result = [];

            for (let m = moment(startDate); m.isBefore(endDate); m.add(1, 'days')) {
                dates.push(m.format('YYYY-MM-DD').toString());
            }

            if (manager_id) {
                employee_ids = _.pluck(await EmailModel.getAssignedEmployees(location_id, department_id, manager_id, employee_id, role_id), 'employee_id');
            }

            const [inComming, outGoing] = await Promise.all([
                EmailModel.emailDataGraph(organization_id, startDate, endDate, 1, location_id, department_id, employee_id, client_type, employee_ids),
                EmailModel.emailDataGraph(organization_id, startDate, endDate, 2, location_id, department_id, employee_id, client_type, employee_ids)
            ]);

            dates.map(date => {
                let inData = inComming.find(x => x._id === date)
                let outData = outGoing.find(x => x._id === date);
                result.push({ date: date, inComming: inData ? inData.count : 0, outGoing: outData ? outData.count : 0 });
            });
            return sendResponse(res, 200, result, result.length > 0 ? 'Graph Data' : 'No Data', null);
        } catch (err) {
            next(err);
        }
    }

    async getMails(req, res, next) {
        try {
            const { organization_id, role_id } = req.decoded;
            const { department_id, employee_id, type, client_type, skip, limit, location_id, startDate, endDate, name } = await EmailValidator.getEmails().validateAsync(req.query);
            const manager_id = req.decoded.employee_id || null;
            let employee_ids = null;

            if (manager_id) {
                employee_ids = _.pluck(await EmailModel.getAssignedEmployees(location_id, department_id, manager_id, employee_id, role_id), 'employee_id');
            }

            let match = { organization_id: organization_id, date: { $gte: startDate, $lte: endDate } };

            if (department_id) match = { department_id: department_id, ...match };

            if (employee_id) {
                match = { employee_id: employee_id, ...match };
            } else {
                if (employee_ids) match = { employee_id: { "$in": employee_ids }, ...match };
            }


            if (type) match = { type: type, ...match };

            if (client_type) match = { client_type: client_type, ...match };

            if (location_id) match = { location_id: location_id, ...match };

            if (name) {
                if (name.length < 3) return sendResponse(res, 400, null, 'Search text must be more than two charecters.')
                match = { ...match, $or: [{ from: { "$regex": name, "$options": "i" } }, { to: { "$regex": name, "$options": "i" } }, { computer: { "$regex": name, "$options": "i" } }] };
            }

            let [emails_list, count] = await Promise.all([
                EmailModel.getMails(match, skip, limit),
                EmailModel.getCount(match)
            ]);
            if (emails_list.length == 0) return res.json({ code: 400, data: null, message: 'Data Not Found.', error: null });

            const emp_ids = _.pluck(emails_list, 'employee_id')
            const names = await EmailModel.getEmpDetails(emp_ids);

            const results = emails_list.map(itr => {
                let nameData = names.find(x => x.id === itr.employee_id)
                const data = {
                    employee_id: itr.employee_id,
                    name: nameData ? nameData.name : '',
                    organization_id: itr.organization_id,
                    department_id: itr.department_id,
                    department_name: nameData ? nameData.department_name : '',
                    location_id: itr.location_id,
                    location_name: nameData ? nameData.location_name : '',
                    subject: itr.subject,
                    body: itr.body,
                    mail_time: itr.mail_time,
                    date: itr.date,
                    attachments: itr.attachments,
                    computer: itr.computer,
                    from: itr.from,
                    to: itr.to,
                    client_type: itr.client_type,
                    type: itr.type,
                }
                return data;
            })
            return res.json({ code: 200, data: { mails: results, totalCount: count, hasMoreData: (skip + limit) >= count ? false : true, skipValue: skip + limit, limit: limit }, message: 'Emails Data.', error: null });

        } catch (err) {
            next(err)
        }
    }



}
module.exports = new EmailActivity;
