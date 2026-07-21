// Organization Details Controller

const multer = require('multer');
const utils = require('util');
const fs = require('fs');
const validator = require('./organizationDetails.validation');
const model = require('./organizationDetails.model');
const sendResponse = require(`${utilsFolder}/myService`).sendResponse;
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { organizationDetailsMessages } = require(`${utilsFolder}/helpers/LanguageTranslate`);

// Controller class
class OrganizationDetailsController {

    /**
     * Get organization Details 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async getOrganizationDetails(req, res) {
        const { organization_id, timezone, language } = req.decoded;
        try {
            let [data] = await model.getOrganizationDetails(organization_id);

            if (data.basic_details) data.basic_details = JSON.parse(data.basic_details);
            if (data.compliance_details) data.compliance_details = JSON.parse(data.compliance_details);

            let bankData = await model.getBankDetails(organization_id);

            data.bank_details = bankData;
            data.admin_timezone = timezone;

            return sendResponse(res, 200, data, translate(organizationDetailsMessages, 'SUCCESS', language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'SOMETHING_WENT_WRONG', language), err);
        }
    }

    /**
     * Update basic Details
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async basicDetails(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = validator.basicDetails(req.body);
            if (error) return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'VALIDATION_FAILED', language), error.details[0].message);

            let [information] = await model.getOrganizationDetails(organization_id);

            if (!information.basic_details) {
                information = JSON.stringify(value);
            }
            else {
                const { registeredCompanyName, brandName, domainName, website, director,
                    email, registeredOfficeAddress, corporateOfficeAddress, contactNumber } = value;

                information = JSON.parse(information.compliance_details);

                information = {
                    registeredCompanyName: registeredCompanyName ?? information.registeredCompanyName,
                    brandName: brandName ?? information.brandName,
                    domainName: domainName ?? information.domainName,
                    director: director ?? information.director,
                    contactNumber: contactNumber ?? information.contactNumber,
                    website: website ?? information.website,
                    email: email ?? information.email,
                    registeredOfficeAddress: registeredOfficeAddress ?? information.registeredOfficeAddress,
                    corporateOfficeAddress: corporateOfficeAddress ?? information.corporateOfficeAddress,
                };
                information = JSON.stringify(information);
            }

            await model.updateBasicDetails(organization_id, information);

            return sendResponse(res, 200, null, translate(organizationDetailsMessages, 'UPDATED_SUCCESSFULLY', language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'SOMETHING_WENT_WRONG', language), err);
        }
    }

    /**
     * Update Bank Details
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async bankDetails(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            let { value, error } = validator.bankDetails(req.body);
            if (error) return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'VALIDATION_FAILED', language), error.details[0].message);

            let [data] = await model.getBankDetails(organization_id, value.id);

            if (!value.id) {
                value.organization_id = organization_id;
                await model.addBankDetails(value);
                return sendResponse(res, 200, null, translate(organizationDetailsMessages, '1', language), null);
            }
            else if (data && data.id == value.id) {
                value.organization_id = organization_id;
                await model.updateBankDetails(value);
                return sendResponse(res, 200, null, translate(organizationDetailsMessages, '2', language), null);
            }
            else return sendResponse(res, 400, null, 'Wrong ID', null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'SOMETHING_WENT_WRONG', language), err);
        }
    }

    /**
     * Update Compliance Details 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async complianceDetails(req, res) {
        const { organization_id, language } = req.decoded;
        try {
            const { value, error } = validator.complianceDetails(req.body);
            if (error) return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'VALIDATION_FAILED', language), error.details[0].message);

            let [information] = await model.getOrganizationDetails(organization_id);

            if (!information.compliance_details) {
                information = JSON.stringify(value);
            }
            else {
                const { uan, pfJoiningDate, excessEPF, excessEPS, existingPFMember, employeeEligibleForPT,
                    employeeEligibleForEsi, esiNumber, pan, ctc, gross, effectiveDate } = value;

                information = JSON.parse(information.compliance_details);

                information = {
                    uan: uan ?? information.uan,
                    pfJoiningDate: pfJoiningDate ?? information.pfJoiningDate,
                    excessEPF: excessEPF ?? information.excessEPF,
                    excessEPS: excessEPS ?? information.excessEPS,
                    existingPFMember: existingPFMember ?? information.existingPFMember,
                    employeeEligibleForPT: employeeEligibleForPT ?? information.employeeEligibleForPT,
                    employeeEligibleForEsi: employeeEligibleForEsi ?? information.employeeEligibleForEsi,
                    esiNumber: esiNumber ?? information.esiNumber,
                    pan: pan ?? information.pan,
                    ctc: ctc ?? information.ctc,
                    gross: gross ?? information.gross,
                    effectiveDate: effectiveDate ?? information.effectiveDate,
                };
                information = JSON.stringify(information);
            }

            await model.updateComplianceDetails(organization_id, information);

            return sendResponse(res, 200, null, translate(organizationDetailsMessages, 'UPDATED_SUCCESSFULLY', language), null);
        }
        catch (err) {
            return sendResponse(res, 400, null, translate(organizationDetailsMessages, 'SOMETHING_WENT_WRONG', language), err);
        }
    }

    /**
     * Get Organization Logo
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async getOrgLogo(req, res) {
        const { organization_id } = req.decoded;
        try {
            // get logo link
            const [{ logo }] = await model.getOrgLogo(organization_id);
            if (!logo) return sendResponse(res, 400, null, 'No Logo Found.', null);

            // link generation of logo
            let apiUrlStr = process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION;
            const logoPath = logo.split('/public/')[1];
            const logoLink = `https://${apiUrlStr}/${logoPath}`;

            // response
            return sendResponse(res, 200, logoLink, 'Success.', null);
        } catch (err) {
            return sendResponse(res, 404, null, 'SOMETHING_WENT_WRONG', null);
        }
    }


    /**
     * Upload organization logos 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Akshay Dhood <akshaybapuraodhood@globussoft.in>
     */
    async uploadImage(req, res) {
        const { organization_id } = req.decoded;
        try {
            // Multer Middleware
            let [[{ logo }]] = await Promise.all([
                model.getOrgLogo(organization_id),
                fileUpload(req, res)
            ]);

            // file related variables 7329
            const file = req.file;
            const logoFilePath = file.path;

            // delete the already exists logo of an organization
            if (logo) {
                fs.unlink(logo, err => {
                    if (err) console.log(err);
                    else console.log('----deleted-----')
                });
            }

            // update organization logo details
            await model.updateLogoPath(logoFilePath, organization_id);

            // link generation of logo
            let apiUrlStr = process.env.NODE_ENV == 'development' ? process.env.API_URL_DEV : process.env.API_URL_PRODUCTION;
            const logoPath = logoFilePath.split('/public/')[1];
            const logoLink = `https://${apiUrlStr}/${logoPath}`;

            // response
            return sendResponse(res, 200, logoLink, 'Success.', null);
        } catch (err) {
            // multer error handle
            if (err instanceof multer.MulterError) {
                if (err.code == 'LIMIT_FILE_SIZE') return sendResponse(res, 404, null, 'File Size is too large. Allowed file size is 2MB', 'SOMETHING_WENT_WRONG');
            }
            else return sendResponse(res, 404, null, 'SOMETHING_WENT_WRONG', null);
        }
    }
}


// multer setup
const fileUpload = utils.promisify(multer({
    storage: multer.diskStorage({
        destination: __dirname.split('src')[0] + 'public/logo/orgLogo',
        filename: (req, file, callback) => {
            callback(null, req.decoded.organization_id + '_' + new Date().getTime() + '_' + file.originalname.toLowerCase().split(' ').join('-'));
        },
    }),
    fileFilter: (req, file, callback) => {
        if ((file.mimetype).includes('jpeg') || (file.mimetype).includes('png') || (file.mimetype).includes('jpg')) {
            callback(null, true);
        } else {
            callback(null, false);
            return callback(new Error('Only images allowed!'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 }, // 2mb allowed
}).single('file'));


// exports controller
module.exports = new OrganizationDetailsController();