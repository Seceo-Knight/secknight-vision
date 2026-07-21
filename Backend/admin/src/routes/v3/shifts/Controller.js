const _ = require('underscore');

const { OrganizationShiftsModel } = require('./OrganizationShiftsModel');
const { Validation } = require('./Validation');
const sendResponse = require('../../../utils/myService').sendResponse;
const actionsTracker = require('../services/actionsTracker');
const { shiftMessages } = require('../../../utils/helpers/LanguageTranslate');
const MomentRange = require('moment-range');
const Moment = require('moment-timezone');
const moment = MomentRange.extendMoment(Moment);

class Controller {
    static async create(req, res) {
        try {
            const { organization_id, user_id: created_by, language } = req.decoded;

            const { value, error } = Validation.create(req.body);
            if (error) {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "2")[language] || shiftMessages.find(x => x.id === "2")["en"], error.details[0].message);
            }
          
            let halfday_productivity = moment.duration(value.productivity_halfday).asMinutes() || 0;
            let present_productivity = moment.duration(value.productivity_present).asMinutes() || 0;
            if(halfday_productivity && present_productivity ){
            if(halfday_productivity >= present_productivity ) return sendResponse(res, 404, null, shiftMessages.find(x => x.id === '2')[language], 'Full-Day Productive Time must be greater than Half-Day Productive Time')
            }
    
            const entity = await OrganizationShiftsModel.getByName(value.name, organization_id, 0);
            if (entity.length > 0) {
                return sendResponse(res, 400, null, shiftMessages.find(x => x.id === "1")[language] || shiftMessages.find(x => x.id === "1")["en"]);
            }
            await transformingData(value);
            const created = await OrganizationShiftsModel.create({ ...value, organization_id, created_by });
            actionsTracker(req, 'Organization shift %i created.', [created.insertId]);
            if (created.affectedRows == 0) return sendResponse(res, 400, null, shiftMessages.find(x => x.id === "3")[language] || shiftMessages.find(x => x.id === "3")["en"], null);
            let data = await modifyData(req.body.data)
            return sendResponse(res, 200, { id: created.insertId, organization_id, name: req.body.name, data: data, created_by, update_by: created_by, notes: req.body.notes || null, location_id: req.body.location_id, color_code: req.body.color_code || null,
                late_period: req.body.late_period ||Number(value?.late_period.split(":")[1]),
                early_login_logout_time: req.body.early_login_logout_time ||Number(value?.early_login_logout_time.split(":")[1]),
                half_day_hours: value?.half_day_hours,
                overtime_period: value?.overtime_period,
                productivity_halfday: value?.productivity_halfday,
                productivity_present: value?.productivity_present
            },
            shiftMessages.find(x => x.id === "4")[language] || shiftMessages.find(x => x.id === "4")["en"],
            null
            );
        } catch (error) {
            return sendResponse(res, 400, null, 'Failed to insert.', 'Failed to insert.');
        }
    }

    static async update(req, res) {
        const { organization_id, user_id: updated_by, language } = req.decoded;
        try {
            const { value, error } = Validation.update(req.body);
            if (error) {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "2")[language] || shiftMessages.find(x => x.id === "2")["en"], error.details[0].message);
            }
            let halfday_productivity = moment.duration(value.productivity_halfday).asMinutes() || 0;
            let present_productivity = moment.duration(value.productivity_present).asMinutes() || 0;
            if(halfday_productivity && present_productivity ){
            if(halfday_productivity >= present_productivity ) return sendResponse(res, 404, null, shiftMessages.find(x => x.id === '2')[language], 'Full-Day Productive Time must be greater than Half-Day Productive Time')
            }
            const entity = await OrganizationShiftsModel.get(value.id, organization_id);

            const get_name = await OrganizationShiftsModel.getByName(value.name, organization_id, value.id);
            if (get_name.length > 0) {
                return sendResponse(res, 400, null, shiftMessages.find(x => x.id === "1")[language] || shiftMessages.find(x => x.id === "1")["en"]);
            }
            if (entity.organization_id != organization_id) {
                return sendResponse(res, 403, null, 'Forbidden');
            }
            await transformingData(value);
            const updated_data = await OrganizationShiftsModel.update(value.id, { ...value, updated_by });

            if (!updated_data.affectedRows) return sendResponse(res, 400, null, shiftMessages.find(x => x.id === "5")[language] || shiftMessages.find(x => x.id === "5")["en"], null);

            const resultData = { ...entity, ...value }
            const data = resultData.data ? await modifyData(resultData.data) : null;
            const { id, name, notes, location_id, late_period, early_login_logout_time, half_day_hours, overtime_period, productivity_halfday, productivity_present, color_code, created_by, ...rest } = resultData;
            const result = {
                id,
                organization_id,
                name,
                data,
                late_period:Number(late_period.split(":")[1]),
                early_login_logout_time:Number(early_login_logout_time.split(":")[1]), 
                half_day_hours,
                overtime_period,
                productivity_halfday,
                productivity_present,
                created_by,
                updated_by,
                notes,
                location_id,
                color_code
            };

            actionsTracker(req, 'Organization shift %i updated.', [id]);
            return sendResponse(res, 200, { result }, shiftMessages.find(x => x.id === "6")[language] || shiftMessages.find(x => x.id === "6")["en"], null);
        } catch (error) {
            if (error.message === 'Record Not Found') {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "7")[language] || shiftMessages.find(x => x.id === "7")["en"]);
            }
            return sendResponse(res, 400, null, 'Unable to update.', 'Unable to update.');
        }

    }

    static async get(req, res) {
        const { organization_id, language } = req.decoded;
        try {

            const { value, error } = Validation.get(req.query);

            if (error) {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "2")[language] || shiftMessages.find(x => x.id === "2")["en"], error.details[0].message);
            }

            if (value.id == 0) {
                let entities = await OrganizationShiftsModel.getByOrgId(organization_id);

                actionsTracker(req, 'Organization shifts %i requested.', [entities.map(entity => entity.id)]);
                entities = entities.map(itr => ({ ...itr, data: modifyData(itr.data) }));
                return sendResponse(res, 200, entities, shiftMessages.find(x => x.id === "8")[language] || shiftMessages.find(x => x.id === "8")["en"], null);
            }

            const entity = await OrganizationShiftsModel.get(value.id);

            if (entity.organization_id != organization_id) {
                return sendResponse(res, 403, null, 'Forbidden');
            }

            actionsTracker(req, 'Organization shift %i requested.', [entity.id]);
            return sendResponse(res, 200, [entity], shiftMessages.find(x => x.id === "8")[language] || shiftMessages.find(x => x.id === "8")["en"], null);
        } catch (error) {
            if (error.message === 'Record Not Found') {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === '7')[language] || shiftMessages.find(x => x.id === '7')['en']);
            }
            return sendResponse(res, 400, null, 'Failed to get shifts at this time, please try again later.', null);
        }

    }

    static async delete(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = Validation.delete(req.body);
            if (error) {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "2")[language] || shiftMessages.find(x => x.id === "2")["en"], error.details[0].message);
            }
            const entity = await OrganizationShiftsModel.get(value.id, organization_id);
            if (!entity) {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "11")[language] || shiftMessages.find(x => x.id === "11")["en"]);
            }
            if (entity.organization_id != organization_id) {
                return sendResponse(res, 403, null, 'Forbidden');
            }

            await OrganizationShiftsModel.delete(entity.id);
            actionsTracker(req, 'Organization shift %i deleted.', [entity.id]);
            return sendResponse(res, 200, { id: entity.id }, shiftMessages.find(x => x.id === "10")[language] || shiftMessages.find(x => x.id === "10")["en"], null);
        } catch (error) {
            if (error.message === 'Record Not Found') {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "7")[language] || shiftMessages.find(x => x.id === "7")["en"]);
            }
            return sendResponse(res, 400, null, 'Unable to delete shift.', 'Unable to delete shift.');
        }

    }

    static async findBy(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = Validation.findBy(req.query);
            if (error) {
                return sendResponse(res, 404, null, shiftMessages.find(x => x.id === "2")[language] || shiftMessages.find(x => x.id === "2")["en"], error.details[0].message);
            }
            let [entities, count] = await Promise.all([
                await OrganizationShiftsModel.findBy({ ...value, organization_id }),
                await OrganizationShiftsModel.count(organization_id),
            ]);
            if (entities.length > 0) {
                entities = entities.map(itr => ({ ...itr, data: modifyData(itr.data) }));
            }
            actionsTracker(req, 'Organization shifts requested (?).', [value]);
            return res.json({
                code: 200, data: entities, count: count[0].count || 0, message: shiftMessages.find(x => x.id === "8")[language] || shiftMessages.find(x => x.id === "8")["en"], error: null,
            });
        } catch (error) {
            return sendResponse(res, 400, null, 'Unable to find shifts.', error);
        }
    }
}

module.exports.Controller = Controller;

function modifyData(data) {
    data = JSON.parse(data);
    const arrayOfObj = Object.entries(data).map((e) => ({ [e[0]]: e[1] }));
    let modify_list = [];
    for (let x of arrayOfObj) {
        let val = Object.values(x);
        let keys = Object.keys(x);
        let arr_shift = val[0];
        arr_shift.day = keys[0];
        modify_list.push(arr_shift);
    }
    let new_modify_list = modify_list.filter(x => {
        return `${x.status}` != 'false'
    })
    let final_shift = [];

    _.map(_.groupBy(new_modify_list, elem => `{start:${elem.time.start},end:${elem.time.end}}`),
        (vals, key) => {
            final_shift.push({
                time: key,
                data: vals
            });
        })
    // let str ='';
    let str = {};

    for (let i of final_shift) {
        let d = i.data.map(n => n.day);
        str[`${d}`] = { status: i.data[0].status, time: { start: i.data[0].time.start, end: i.data[0].time.end } }
    }

    return JSON.stringify(str);
}
//to convert input numbers into required time format 00:00
function transformingData(value){
    (value.late_period || value.late_period === 0) ? value.late_period =`00:${String(value.late_period).padStart(2, '0')}`: null ;
    (value.early_login_logout_time|| value.early_login_logout_time === 0) ?value.early_login_logout_time=`00:${String(value.early_login_logout_time).padStart(2, '0')}`:null;
   
    return value;
}