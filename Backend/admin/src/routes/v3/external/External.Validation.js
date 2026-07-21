const Joi = require('@hapi/joi');
const Common = require('../../../utils/helpers/Common');
const moment = require('moment');

class ExternalValidator {
    addTokenTeleWorksDataValidate() {
        return Joi.object().keys({
            spToken: Joi.string().required(),
            labourOfficeId: Joi.string().required(),
            sequenceNumber: Joi.string().required(),
            timezone: Joi.string().required(),
            time: Joi.string().required(),
        });
    }

    validateDomain() {
        return Joi.object().keys({
            service1: Joi.string().uri().required(),
            service2: Joi.string().uri().required(),
            service3: Joi.string().uri().required(),
            service4: Joi.string().uri().required(),
            service5: Joi.string().uri().required(),

            main_domain: Joi.string().uri().required(),
            frontend_domain: Joi.string().uri().required(),
            organization_id: Joi.number().required(),
            admin_email: Joi.string().email().required(),
            a_admin_email: Joi.string().email().required(),
            crypto_key: Joi.string().required(),
        })
    }
    validateEnvs() {
        return Joi.object().keys({
            dec_key: Joi.string().required(),
            dec_iv: Joi.string().required(),
            dec_OPENSSL_CIPHER_NAME: Joi.string().required(),
            dec_CIPHER_KEY_LEN: Joi.string().required(),
            organization_id: Joi.number().required(),
            admin_email: Joi.string().email().required(),
            a_admin_email: Joi.string().email().required(),
        })
    }

    webAppValidation() {
        return Joi.object().keys({
            employee_id: Joi.number().required(),
            skip: Joi.number().min(0).default(0),
            limit: Joi.number().min(0).default(10),
            search: Joi.string().allow(null, ''),
            start_date: Joi.date().iso().required(),
            end_date: Joi.date().iso().required().greater(Joi.ref('start_date')),
        });
    }

    validateWebUsageData({ body, empData }) {
        let presentEmail = [], notPresentEmail = [];
        Object.entries(body).map(([email, webData]) => {
            const ifEmpPres = empData.find(i => i.email == email);
            if (!ifEmpPres) {
                notPresentEmail.push({ email, webData });
            } else {
                presentEmail.push({ email, webData, employeeId: ifEmpPres.employee_id });
            }
        });
        presentEmail = presentEmail.map(item => {
            item.inValidWebData = item?.webData.filter(i => !moment(i.start_time).isValid() || !moment(i.end_time).isValid());
            item.webData = item?.webData.filter(i => moment(i.start_time).isValid() && moment(i.end_time).isValid());
            return item;
        });
        return { presentEmail, notPresentEmail };
    }

    assignEmployeeResellerValidation() {
        return Joi.object().keys({
            employee_id: Joi.array().items(Joi.number().required()).default([]),
            reseller_organization_id: Joi.number().required(),
        });
    }

    getAssignedEmployeeResellerValidation() {
        return Joi.object().keys({
            reseller_organization_id: Joi.number().required(),
        });
    }
}
module.exports = new ExternalValidator;
