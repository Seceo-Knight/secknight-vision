
const Joi = require('@hapi/joi');
const Common = require('../../../../utils/helpers/Common');

class ReportActivityValidator {
    getActivityLogs() {
        return Joi.object().keys({
        }).required();
    }

}
module.exports = new ReportActivityValidator;