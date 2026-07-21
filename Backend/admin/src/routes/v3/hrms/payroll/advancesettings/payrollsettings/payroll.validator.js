const Joi = require('joi');
const { bool, obj, num, str, strRequired } = require('../pfandesisettings/overview/overview.validator');
const Common = require(`${utilsFolder}/helpers/Common`);

const day = () => num().min(0).max(31).required();
const cycle = () => obj().keys({
    from: day(),
    to: day()
}).required()

class PayrollValidator {
    /**
     * A function for validate update payroll parameters
     * @function updatePayrollSettings
     * @param {*} params
     * @returns {*} Values or Error 
     */
    static updatePayrollSettings(params) {
        return Joi.validate(params,
            Joi.object().keys({
                payrollAllowed: bool().required(),
                includeWeeklyOffs: bool().required(),
                includeHolidays: bool().required(),
                payrollLeaveAttendanceCycle: cycle(),
                paycycle: cycle(),
                payFrequency: Joi.string().valid('Monthly', 'Annually', 'SemiAnnually').required(),
                salaryStructure: Joi.string().valid('CTC', 'GROSS').required(),
                effectiveDate: Joi.date().required(),
                payoutDate: day(),
                cutOffDateNewJoinees: day(),
            }));
    }
}
module.exports = PayrollValidator;