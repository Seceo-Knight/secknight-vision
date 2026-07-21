const _ = require('underscore');

const { SettingsValidation: Validation } = require('./settings.validation');
const { SettingsModel } = require('./settings.model');
const { sendResponse } = require(`${utilsFolder}/myService`),
    { translate } = require(`${utilsFolder}/messageTranslation`),
    { commonMessages, locationMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`),
    { pfModel } = require('../pfandesisettings/pfsettings/pf.model'),
    { PfService } = require('../pfandesisettings/pfsettings/pf.service'),
    { settings, details } = require('../../../bankdetail/default.payrollsettings'),
    moment = require('moment');
const payRegisterService = require('../../run-payroll/run-payroll/pay-register.service');
const PreviewService = require('../../run-payroll/preview/preview.service');

class SettingsService {
    /**
     * A function for add PT settings
     * @function professionalTax
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static async professionalTax(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;

            const { value, error } = Validation.create(req.body);
            if (error) return sendResponse(res, 404, null, 'Validation error.', error.details[0].message);
            const { effective_date, locations } = value;

            // Find duplicate amount in location data
            for (let item of locations) {
                let amounts = _.pluck(item.details, "amount");
                let duplicates = amounts.filter((item, index) => amounts.indexOf(item) !== index)
                if (duplicates && duplicates.length > 0) return sendResponse(res, 400, value, 'Duplicate amount exists in location data', null);
            }

            const oldPt = await SettingsModel.getPt({ organization_id });
            const existedIds = _.pluck(oldPt, 'location_id');
            const newIds = _.pluck(locations, 'location_id');
            const toBeRemovedIds = existedIds.filter(item => !newIds.includes(item));

            for (const { location_id, details } of locations) {
                if (toBeRemovedIds.includes(location_id)) continue;
                if (existedIds.includes(location_id)) {
                    await SettingsModel.updatePt({ organization_id, location_id, details, effective_date });
                } else {
                    await SettingsModel.addPt({ organization_id, location_id, details, effective_date });
                }
            }
            // if (toBeRemovedIds.length > 0) {
            //     await SettingsModel.deletePt({ organization_id, location_ids: toBeRemovedIds });
            // }
            return sendResponse(res, 200, null, 'success.', null);
        } catch (err) {
            next(err);
        }
    }

    /**
     * A function for update PT settings
     * @function updatePTSettings
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static async updatePTSettings(req, res, next) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = Validation.update(req.body);
            if (error) return sendResponse(res, 401, null, translate(commonMessages, "3", language), error.details[0].message);

            /**get organization settings */
            let settings = await PfService.getOrgPFSettings(organization_id);

            value.ptEffectiveDate = value.ptEffectiveDate ? moment(value.ptEffectiveDate).format('YYYY-MM-DD') : value.ptEffectiveDate;

            let newSettings = settings.length > 0 && settings[0]['settings'] ? JSON.parse(settings[0]['settings']) : {};
            newSettings = {
                ...newSettings,
                ptSettings: {
                    ptAllowed: value.ptAllowed,
                    ptStateOverride: value.ptStateOverride,
                    ptEffectiveDate: value.ptEffectiveDate,
                    allStates: value.allStates,
                }
            }
            newSettings = JSON.stringify(newSettings);

            if (settings.length > 0 && settings[0]['settings']) {
                await pfModel.updatePfSettings(organization_id, newSettings);
            } else {
                await pfModel.createPfSettings(organization_id, newSettings);
            }
            return sendResponse(res, 200, { ...value }, translate(commonMessages, "1", language), null);
        } catch (err) {
            console.log(err, '------err-----')
            next(err);
        }
    }

    /**
     * A function for get PT settings
     * @function getPTSettings
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    static async getPTSettings(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            /**get organization settings */
            let [settings, locations] = await Promise.all([
                PfService.getOrgPFSettings(organization_id),
                SettingsModel.getPt({ organization_id })
            ])
            if (settings.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);

            settings = JSON.parse(settings[0]['settings']);
            settings = {
                ptAllowed: settings.ptSettings && settings.ptSettings.ptAllowed ? settings.ptSettings.ptAllowed : false,
                ptStateOverride: settings.ptSettings && settings.ptSettings.ptStateOverride ? settings.ptSettings.ptStateOverride : false,
                ptEffectiveDate: settings.ptSettings && settings.ptSettings.ptEffectiveDate ? settings.ptSettings.ptEffectiveDate : null,
                allStates: settings.ptSettings && settings.ptSettings.allStates ? settings.ptSettings.allStates : true
            }
            locations = locations.map(itr => ({ ...itr, details: itr.details ? JSON.parse(itr.details) : null }))

            return sendResponse(res, 200, { ...settings, locations }, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }

    /**
     * A function for delete PT Location
     * @function getPTSettings
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    static async deletePTLocation(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = Validation.deletePTLocation(req.body);
            if (error) return sendResponse(res, 404, null, translate(commonMessages, "3", language), error.details[0].message);

            await SettingsModel.deletePt({ organization_id, location_ids: value.locations })
            return sendResponse(res, 200, null, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err);
        }
    }

    /**
     * A function for get overview
     * @function getOverview
     * @param {*} req
     * @param {*} res
     * @param {*} next
     */
    static async getOverview(req, res, next) {
        try {
            const { organization_id, employee_id: loginEmployeeId, role_id, is_manager, is_teamlead, language } = req.decoded;
            const { value, error } = Validation.getOverview(req.query);
            if (error) return sendResponse(res, 404, null, translate(commonMessages, "3", language), error.details[0].message);
            const { skip, limit, order, sort, search, employee_id } = value;

            let is_assigned_to = is_manager || is_teamlead ? loginEmployeeId : null;

            let [employeeData, count, settings, locations] = await Promise.all([
                SettingsModel.getEmployees({ skip, limit, order, sort, search, employee_id, organization_id, is_assigned_to, role_id }),
                SettingsModel.getEmployees({ skip, limit, order, sort, search, employee_id, organization_id, is_assigned_to, role_id, isCount: true }),
                PfService.getOrgPFSettings(organization_id),
                SettingsModel.getPt({ organization_id })
            ])
            if (employeeData.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "2", language), null);
            count = count.length !== 0 ? count[0].totalCount : 0;
            settings = JSON.parse(settings[0]['settings']);

            let ptAllowed = settings.ptSettings && settings.ptSettings.ptAllowed ? settings.ptSettings.ptAllowed : false;

            let result = [];
            let date = moment().format('YYYY-MM-DD');


            for (let item of employeeData) {

                // let empPtSettings = item.settings ? JSON.parse(item.settings) : {};
                let empPtSettings = item.details ? JSON.parse(item.details) : {};

                item = { ...item, ptAllowed: false }
                let locationData = locations.find(i => i.location_id == item.location_id);
                let employeeDetails = item.details ? JSON.parse(item.details) : null
                let ptAmount = 0;

                // ptAllowed = ptAllowed && empPtSettings && empPtSettings.ptSettings && (empPtSettings.ptSettings.ptAllowed == true || empPtSettings.ptSettings.ptAllowed == false) ? empPtSettings.ptSettings.ptAllowed : (ptAllowed || false)
                ptAllowed = ptAllowed && empPtSettings && empPtSettings.eligible_pt && empPtSettings.eligible_pt == 1 ? true : (ptAllowed || false)

                if (locationData && ptAllowed) {
                    item = { ...item, ptAllowed }
                    locationData = locationData.details ? JSON.parse(locationData.details) : {}
                    locationData = locationData.details || [];

                    let gross = await PreviewService.getPreview({ calcType: "M", organization_id, employeeId: item['id'], date: date });
                    // gross = gross && gross.length !== 0 && gross[0]['gross'] && typeof (+gross[0]['gross']) == 'number' ? +gross[0]['gross'] : 0;
                    // gross = typeof (+gross) == 'number' ? (gross / 12) : 0
                    ptAmount = await payRegisterService.calculatePT({ gross, ptSetting: locationData })
                }
                item = { ...item, ptAmount: item.ptAllowed ? ptAmount : ptAmount };
                delete item.settings;
                delete item.details;
                delete item.totalCount;
                result.push(item);
            }

            return sendResponse(res, 200, { count, skipCount: skip + limit, employeeData: result }, null, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err)
        }
    }

    /**
     * A function for update overview
     * @function updateOverview
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static async updateOverview(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;
            const { value, error } = Validation.updateOverview(req.body);
            if (error) return sendResponse(res, 404, null, translate(commonMessages, "3", language), error.details[0].message);

            let { ptEffectiveDate, location_id, employee_id, ptAllowed } = value;
            ptEffectiveDate = moment(ptEffectiveDate).format('YYYY-MM-DD');
            value.ptEffectiveDate = ptEffectiveDate;

            let employeeSettings = await SettingsModel.getSingleEmployeeData({ organization_id, employee_id });
            if (employeeSettings.length == 0) return sendResponse(res, 400, null, translate(commonMessages, "4", language), null);

            let newEmployeeSettings = employeeSettings[0].settings ? JSON.parse(employeeSettings[0].settings) : null;
            if (location_id) {
                const locationData = await SettingsModel.getLocation(organization_id, location_id)
                if (locationData.length == 0) return sendResponse(res, 400, null, translate(locationMessages, "8", language), null);
            }
            newEmployeeSettings = {
                ...settings,
                ...newEmployeeSettings,
                ptSettings: {
                    ptEffectiveDate,
                    location_id,
                    ptAllowed
                },
            }
            newEmployeeSettings = JSON.stringify(newEmployeeSettings);

            if (!employeeSettings[0].id) {
                await SettingsModel.addEmployeePayrollSettings({ organization_id, employee_id, settings: newEmployeeSettings })
            } else {
                await SettingsModel.updateEmployeePayrollSettings({ organization_id, employee_id, settings: newEmployeeSettings })
            }

            return sendResponse(res, 200, value, translate(commonMessages, "1", language), null);
        } catch (err) {
            next(err);
        }
    }

    /**
     * A function for add PT values
     * @function professionalTaxByLocation
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    static async professionalTaxByLocation(req, res, next) {
        try {
            const { organization_id, language } = req.decoded;

            const { value, error } = Validation.getPT(req.query);
            if (error) return sendResponse(res, 404, null, 'Validation error.', error.details[0].message);

            const { location_id } = value;
            let pt = await SettingsModel.getPt({ organization_id, location_id });
            if (pt.length > 0) {
                pt = pt.map(x => {
                    x.details = JSON.parse(x.details);
                    return x;
                })
                return sendResponse(res, 200, pt, 'success.', null);
            }

            return sendResponse(res, 400, null, 'No data Found.', null);
        } catch (err) {
            next(err);
        }
    }
}

module.exports.SettingsService = SettingsService;
