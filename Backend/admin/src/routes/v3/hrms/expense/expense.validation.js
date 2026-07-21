const Joi = require('joi');
const Common = require('../../../../utils/helpers/Common');

class ExpenseValidation {

  addNewExpense(params) {
    const schema = Joi.object().keys({
      employee_id: Joi.number().required(255),
      expense_type: Joi.string().required().max(255),
      bill_image: Joi.string().required().max(255),
      amount: Joi.number().required().max(100000000),
      purchase_date: Joi.string().required().max(100),
      remarks: Joi.string().required().max(500),
    });
    return Joi.validate(params, schema);
  }

  updateExpense(params) {
    const schema = Joi.object().keys({
      id: Joi.string().required(255),
      employee_id: Joi.number().required(255),
      expense_type: Joi.string().required().max(255),
      bill_image: Joi.string().allow(null, "").max(255),
      amount: Joi.number().required().max(1000000000),
      purchase_date: Joi.string().required().max(100),
      remarks: Joi.string().required().max(500),
    });
    return Joi.validate(params, schema);
  }
}

module.exports = new ExpenseValidation;