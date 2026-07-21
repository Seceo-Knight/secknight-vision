const redis = require("../auth/services/redis.service");
const { sendEmail } = require("./delOrganization.utils");

class deleteOrganizationService {
    async sendMailHelper () {
        
        let code = Math.floor(1000 + Math.random() * 9000); //Generating OTP

        await redis.setAsync('otp_for_organization_data_delete', code, 'EX', 60 * 10); //Temporary set otp to redis

        let email = process.env.EMAIL_ORGANIZATION_DATA_DELETE;

        if (!email) throw Error("No Email Found!");
        if (!(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email))) throw Error("Wrong Email Format!");
        let name = "EMP Monitor";
        
        return sendEmail({ email, name, code, message: "Organization Data Delete" });   // Send Email with template
    }
}

module.exports = new deleteOrganizationService;