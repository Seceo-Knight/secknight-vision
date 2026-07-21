'use strict';

const Joi = require('@hapi/joi');
// const Common = require('../../../../utils/helpers/Common')
const Common = require('../../../utils/helpers/Common');

class AuthValidator {
  validateUserAuthParams() {
    return Joi.object()
      .keys({
        email: Joi.string().required().trim(),
        password: Joi.string().required().trim(),
        ip: Joi.string().trim().default(null),
      })
      .required();
  }

  validateAdminAuthParams() {
    return Joi.object()
      .keys({
        // name/product_id/begin_date/expire_date/timezone were required here for the
        // original EmpCloud-licensing SSO flow (which supplied all of these itself).
        // For standalone on-prem email+password login, only email/password come from
        // the client — everything else is optional and defaulted server-side in
        // AuthService.adminAuth().
        name: Joi.string().trim().optional(),
        first_name: Joi.string()
          .trim()
          .max(64)
          .regex(/[$\(\)<>]/, {invert: true})
          .error(err => {
            return Common.hapijoiStringErrorMessage(err);
          }),
        last_name: Joi.string()
          .trim()
          .max(64)
          .regex(/[$\(\)<>]/, {invert: true})
          .error(err => {
            return Common.hapijoiStringErrorMessage(err);
          }),
        email: Joi.string()
          .required()
          .trim()
          .max(128)
          .regex(/[$\(\)<>]/, {invert: true})
          .error(err => {
            return Common.hapijoiStringErrorMessage(err);
          }),
        password: Joi.string().required().min(6).max(128).trim(),
        username: Joi.string()
          .trim()
          .max(50)
          .regex(/[$\(\)<>]/, {invert: true})
          .error(err => {
            return Common.hapijoiStringErrorMessage(err);
          }),
        address: Joi.string().allow('').trim().max(512),
        phone: Joi.string().allow('').trim(),
        product_id: Joi.number().optional(),
        begin_date: Joi.date().optional(),
        expire_date: Joi.date().optional(),
        timezone: Joi.string().optional(),
        amember_id: Joi.number().positive().default(null).allow(null).optional(),
        total_allowed_user_count: Joi.number().positive().optional(),
        region: Joi.number().optional().default(1).allow(1, 2),
        expiryDays: Joi.string().optional().default('30d'),
        is_on_prem: Joi.string().valid("true", 'false').default("false"),
        is_blocked: Joi.string().valid("true", 'false').default("false"),
      })
      .required();
  }

  validateUserAccountSwitch() {
    return Joi.object()
      .keys({
        role_id: Joi.number().positive().required(),
      })
      .required();
  }

  validategetOrg() {
    return Joi.object()
      .keys({
        email: Joi.string().required().trim(),
      })
      .required();
  }

  validateUserParams() {
    return Joi.object()
      .keys({
        employeeId: Joi.number().positive().required(),
      })
      .required();
  }

  validateOtpParams() {
    return Joi.object()
      .keys({
        email: Joi.string().email().required(),
        otp: Joi.number().required().min(100000).max(999999),
      })
      .required();
  }
}

module.exports = new AuthValidator();
