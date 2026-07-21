/** HRMSPassword Controller */

/** Imports */
const validator = require("./hrmsPassword.validator");
const HRMSPasswordService = require("./hrmsPassword.service");


/**
 * @class HRMSPasswordController
 * Controller Methods for HRMSPassword Routes
 */
class HRMSPasswordController {


    /**
     * Check Password for HRMS and Bank Button
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async checkPassword(req, res) {

        /** Data from token */
        let { organization_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.checkPassword(req.query);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error!", error: error.details[0].message });

            /** Calling Service */
            let data = await new HRMSPasswordService().checkPasswordService({ ...value, organization_id });

            let message = data ? "success" : "Password not set, Please create new Password!";

            /** Response */
            return res.json({ code: 200, data, message, error: null });
        } catch (error) {

            /** If Error */
            if (error instanceof Error)
                return res.json({ code: 400, data: null, message: error.message, error: null });

            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }


    /**
     * Creates Password for HRMS and Bank Button
     * @function createPassword
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async addPassword(req, res) {

        /** Data from token */
        let { organization_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.checkPassword(req.body);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error!", error: error.details[0].message });

            /** Calling Service */
            await new HRMSPasswordService().addPasswordService({ ...value, organization_id });

            /** Response */
            return res.json({ code: 200, data: null, message: "success", error: null });
        } catch (error) {

            /** If Error */
            if (error instanceof Error)
                return res.json({ code: 400, data: null, message: error.message, error: null });

            // Error Response
            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }


    /**
     * If Admin Forgot Password 
     * @function forgotPassword
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async forgotPassword(req, res) {

        /** Data from token */
        let { organization_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.forgotPassword(req.query);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error!", error: error.details[0].message });

            /** Calling Service */
            await new HRMSPasswordService().forgotPasswordService({ ...value, organization_id });

            /** Response */
            return res.json({ code: 200, data: null, message: "Mail sent!", error: null });
        } catch (error) {

            /** If Error */
            if (error instanceof Error)
                return res.json({ code: 400, data: null, message: error.message, error: null });

            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }


    /**
     * Check Code form mail
     * @function checkForgotPasswordCode
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    async checkForgotPasswordCode(req, res) {
        /** Data from token */
        let { organization_id } = req.decoded;
        try {

            /** Validation */
            const { value, error } = validator.forgotPasswordCode(req.body);
            if (error) return res.json({ code: 400, data: null, message: "Validation Error!", error: error.details[0].message });

            /** Calling Service */
            await new HRMSPasswordService().checkForgotPasswordCodeService({ ...value, organization_id });

            /** Response */
            return res.json({ code: 200, data: null, message: "success", error: null });
        } catch (error) {

            /** If Error */
            if (error instanceof Error)
                return res.json({ code: 400, data: null, message: error.message, error: null });

            return res.json({ code: 400, data: null, message: "SOMETHING_WENT_WRONG", error: null });
        }
    }
}


/** Exports */
module.exports = HRMSPasswordController;