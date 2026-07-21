/** HRMSPassword Service */

/** Imports */
const { sendEmail } = require("./hrmsPassword.utils");
const HRMSPasswordModel = require("./hrmsPassword.model");
const redis = require("../../auth/services/redis.service");
const PasswordEncoderDecoder = require("../../../../utils/helpers/PasswordEncoderDecoder");


/**
 * @class HRMSPasswordService
 * Services for HRMSPassword Controllers
 */
class HRMSPasswordService {

    /**
     * Service for Checking HRMS and Bank Button Password
     * @function checkPasswordService
     * @param {*} param0 
     * @returns 
     */
    async checkPasswordService({ type, password, organization_id }) {

        let column = type == 1 ? "hrms_password" : "bank_password";

        let [{ [column]: dbPassword }] = await new HRMSPasswordModel().getPassword({ column, organization_id });
        dbPassword = dbPassword ? PasswordEncoderDecoder.passwordDecrypt(dbPassword) : null;

        if (!dbPassword || dbPassword == password) return dbPassword;
        else throw Error("Invalid Password!");
    }


    /**
     * Service for Creating HRMS and Bank Button Password
     * @function checkPasswordService
     * @param {*} param0 
     * @returns 
     */
    async addPasswordService({ type, password, organization_id }) {

        let column = type == 1 ? "hrms_password" : "bank_password";
        password = PasswordEncoderDecoder.passwordEncrypt(password);

        let [{ id, [column]: dbPassword }] = await new HRMSPasswordModel().getPassword({ column, organization_id });

        if (dbPassword) throw Error("Password already created.");

        if (id) await new HRMSPasswordModel().UpdatePasswordRow({ column, password, organization_id });
        else await new HRMSPasswordModel().createPasswordRow({ column, password, organization_id });
    }


    /**
     * Sent Mail to Email for Password Reset
     * @function forgotPasswordService
     * @param {*} param0 
     * @returns
     */
    async forgotPasswordService({ type, organization_id }) {

        let column = type == 1 ? "hrms_password" : "bank_password";
        let code = Math.floor(1000 + Math.random() * 9000);
        let message = `${column}_reset_for_${organization_id}`;
        await redis.setAsync(message, code, 'EX', 60 * 30);

        let [{ name, email, a_email }] = await new HRMSPasswordModel().getOrganizationData({ organization_id });
        email = email ? email : a_email;

        if (!email) throw Error("No Email Found!");
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) throw Error("Wrong Email Format!");

        let messageEmail = type == 1 ? "HRMS" : "Bank Button";
        return sendEmail({ email, name, code, message: messageEmail });
    }


    /**
     * Check the Code from email
     * @function checkForgotPasswordCodeService
     * @param {*} param0 
     * @returns 
     */
    async checkForgotPasswordCodeService({ type, code, password, organization_id }) {

        let column = type == 1 ? "hrms_password" : "bank_password";
        let message = `${column}_reset_for_${organization_id}`;
        let dbCode = await redis.getAsync(message);

        if (dbCode == code) {
            password = PasswordEncoderDecoder.passwordEncrypt(password);

            let [{ id }] = await new HRMSPasswordModel().getPassword({ column, organization_id });

            if (id) await new HRMSPasswordModel().UpdatePasswordRow({ column, password, organization_id });
            else await new HRMSPasswordModel().createPasswordRow({ column, password, organization_id });
        }
        else throw Error("Wrong Code!");
    }
}


/** Exports */
module.exports = HRMSPasswordService;