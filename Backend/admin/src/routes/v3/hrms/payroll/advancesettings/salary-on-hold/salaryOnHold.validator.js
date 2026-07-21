const Joi = require('joi');


class SalaryOnHoldValidation {

    /**
       * getslaryHoldValidation - function to validate request salary on hold get method
       * 
       * @param {*} params 
       * @returns sucees or error json object
       * @author Mahesh D <maheshd@globussoft.in>
       */
    static getslaryHoldValidation(params) {
        return Joi.validate(params, Joi.object().keys({
            date: Joi.date().required()
        }))
    }

    /**
    * validateSalaryHoldEdit - function to validate request salary on hold put method
    * 
    * @param {*} params 
    * @returns sucees or error json object
    * @author Mahesh D <maheshd@globussoft.in>
    */
    static validateSalaryHoldEdit(params) {
        return Joi.validate(params,
            Joi.object().keys({
                employee_id: Joi.number().required(),
                hold_type: Joi.string().required().valid('pay', 'hold')
            })
        );
    }

    /**
    * validateSalaryHoldConponents - function to validate request component's on salary on hold post method
    * 
    * @param {*} params 
    * @returns sucees or error json object
    * @author Mahesh D <maheshd@globussoft.in>
    */
    static validateSalaryHoldConponents(params) {
        return Joi.validate(params,
            Joi.object().keys({
                salary_hold_components: Joi.array().items(
                    Joi.object().keys({
                        from: Joi.string().required(),
                        to: Joi.string().required(),
                        employee_id: Joi.number().required()
                    })
                ).required(),
            })
        )

    }

}

module.exports = SalaryOnHoldValidation
