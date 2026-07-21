const moment = require('moment-timezone');
const HolidayModel = require('./holiday.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const HolidayValidation = require('./holiday.validation');
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { holidayMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./holiday.validation');

class HolidayController {

    /**
   * Get holidays
   *
   * @function getHolidays
   * @memberof  HolidayController;
   * @param {*} req
   * @param {*} res
   * @returns {object} request list or error
   */
    async getHolidays(req, res) {
        let { organization_id,is_employee,language } = req.decoded;

        try {
            // validation
            let { value, error } = joiValidation.getHolidays(req.query);
            if (error) return sendResponse(res, 404, null, translate(holidayMessages, "2", language), error.details[0].message);
            const {date}=value;
            const year= value?.date?moment(date).format('YYYY'):moment().format('YYYY');
            if(is_employee){
                const current_date=moment().format("YYYY-MM-DD");
                // Fetch holidays
                let holiday = await HolidayModel.fetchholidaysList(organization_id, current_date);
                holiday = holiday.sort((x, y) => x.holiday_date - y.holiday_date);
    
                // return holidays
                return holiday.length ? sendResponse(res, 200, holiday, translate(holidayMessages, "9", language), null) : sendResponse(res, 400, null, "No holidays found", null)
                }
            
            let holiday=await HolidayModel.fetchholidaysByYear(organization_id,year)
            holiday=holiday.sort((x,y) => x.holiday_date-y.holiday_date);
            
            return holiday.length ? sendResponse(res, 200, holiday, translate(holidayMessages, "9", language), null) : sendResponse(res, 400, null, "No holidays found", null);
             
        } catch (err) {
            return sendResponse(res, 400, null, translate(holidayMessages, "10", language), null);
        }

    }

    async fetchHolidays(req, res) {
        let { organization_id } = req.body;
        try {
            const year= moment().format('YYYY');
            
            let holiday = await HolidayModel.fetchholidaysByYear(organization_id,year);
            holiday=holiday.sort((x,y) => x.holiday_date-y.holiday_date);
            
            return holiday.length ? sendResponse(res, 200, holiday, "Holidays Fetched Successfully", null) : sendResponse(res, 400, null, "No holidays found", null);
             
        } catch (err) {
            return sendResponse(res, 400, null, 'Something went wrong', null);
        }
    }
   
    /**
    * Create holidays
    *
    * @function createHolidays
    * @memberof  HolidayController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async createHolidays(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let { value, error } = joiValidation.addNewHolidays(req.body);
            if (error) return sendResponse(res, 404, null, translate(holidayMessages, "2", language), error.details[0].message);

            const start = moment().startOf('year').format('YYYY-MM-DD'),
                end = moment().endOf('year').format('YYYY-MM-DD');
            let { holidays } = value,
                holiday_name = holidays.map(x => x.holiday_name),
                holiday_date = holidays.map(x => x.holiday_date),
                holiday_exist = await HolidayModel.getHolidayName(holiday_name, start, end, organization_id);
            if (holiday_exist.length > 0) return sendResponse(res, 400, null, "Holiday name  already Exist.", null);

            holiday_exist = await HolidayModel.getHolidayDate(holiday_date, organization_id);
            if (holiday_exist.length > 0) return sendResponse(res, 400, null, "Holiday date already Exist.", null);
            holidays = holidays.map(x => [x.holiday_name, x.holiday_date, organization_id]);

            const add_holidays = await HolidayModel.addholidays(holidays,);
            if (add_holidays) if (add_holidays.insertId) return sendResponse(res, 200, { id: add_holidays.insertId || null, holidays }, translate(holidayMessages, "3", language), null);
            return sendResponse(res, 400, null, translate(holidayMessages, "7", language), null);

        } catch (err) {
            return sendResponse(res, 400, null, translate(holidayMessages, "8", language), err);
        }
    }

    /**
     * Delete holidays
     *
     * @function deleteHolidays
     * @memberof  HolidayController;
     * @param {*} req
     * @param {*} res
     * @returns {object} request list or error
     */
    async deleteHolidays(req, res) {
        let { organization_id, language } = req.decoded;
        let id = req.decoded;
        let ids = req.body.id;
        try {
            const delete_holidays = await HolidayModel.deleteHolidays(ids, organization_id);
            if (delete_holidays) return sendResponse(res, 200, [], translate(holidayMessages, "13", language), null);

            return sendResponse(res, 400, null, translate(holidayMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(holidayMessages, "15", language), null);
        }
    }

    /**
    * Update holidays
    *
    * @function updateHoliday
    * @memberof  HolidayController;
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateHoliday(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            const { value, error } = HolidayValidation.updateHoliday(req.body);
            if (error) return sendResponse(res, 404, null, translate(holidayMessages, "2", language), error.details[0].message);
            const { id, holiday_name, holiday_date } = value;

            let holidaydates = await HolidayModel.getHolidaydateList(holiday_date, organization_id)
            if (holidaydates.length > 0) return sendResponse(res, 400, null, "Holiday already Exist on the data given! ", null);

            const holiday = await HolidayModel.updateHoliday(id, holiday_name, holiday_date, organization_id);
            if (holiday.affectedRows !== 0) return sendResponse(res, 200, { ...value }, translate(holidayMessages, "6", language), null);
            return sendResponse(res, 400, null, translate(holidayMessages, "14", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(holidayMessages, "15", language), err);
        }
    }

}

module.exports = new HolidayController;