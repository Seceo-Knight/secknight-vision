
const { ResellerValidation } = require('./Reseller.Validation');
const { settingMessages, resellerMessage, groupMessages } = require('../../../../utils/helpers/LanguageTranslate');
const { translate } = require('../../../../utils/messageTranslation');
const { ResellerModel } = require('./Reseller.Model');
const moment = require('moment');
const eventEmitter = require('../../../../event/eventEmitter');
const redis = require('../../auth/services/redis.service')
const actionsTracker = require('../../services/actionsTracker');
class ResellerController {

    /**
     *Upsert reseller information
     *
     * @function upsert
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  updated settings or Error.
     */
    static async upsert(req, res) {
        const { user_id, organization_id, language = 'en' } = req.decoded;
        const { error, value } = ResellerValidation.update(req.body);

        if (error) {
            return res.json({ code: 404, data: null, message: translate(settingMessages, "2", language), error: error.details[0].message });
        }
        try {
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (reseller) {
                await ResellerModel.update({ ...value, userId: user_id, status: 1, details: JSON.stringify(value) });
            } else {
                await ResellerModel.insert({ ...value, userId: user_id, status: 1, details: JSON.stringify(value) });
            }
            return res.json({ code: 200, data: value, message: translate(resellerMessage, "1", language), error: null });
        } catch (err) {
            console.log('----------', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     *Get reseller information
     *
     * @function get
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  information or Error.
     */
    static async get(req, res) {
        const { user_id, organization_id, language = 'en' } = req.decoded;
        try {
            let result = null;
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (reseller) {
                result = { ...JSON.parse(reseller.details) };
            }
            return res.json({ code: 200, data: result, error: null, message: 'data' });
        } catch (err) {
            console.log('-----', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     *Add client information
     *
     * @function addClient
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  add or Error.
     */
    static async addClient(req, res) {
        const { user_id, organization_id, language = 'eng' } = req.decoded;
        try {
            const { error, value } = ResellerValidation.amember(req.body);
            const { amember_id: amemberId } = value;
            if (error) {
                return res.json({ code: 404, data: null, message: translate(settingMessages, "2", language), error: error.details[0].message });
            }
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            let [clients] = await ResellerModel.clientStats({ resellerId: reseller.reseller_id, amemberId });
            if (clients) return res.json({ code: 400, data: null, message: translate(resellerMessage, "5", language), err: "Already present." });

            const client = await ResellerModel.addClient({ amemberId, resellerId: reseller.reseller_id });
            let clientStats = await ResellerModel.clientStats({ resellerId: reseller.reseller_id, amemberId });
            clientStats = clientStats.map(x => {
                x.expiry = JSON.parse(x.expiry);
                return x;
            })
            return res.json({ code: 200, data: clientStats[0], message: translate(resellerMessage, "3", language), error: null });
        } catch (err) {
            console.log('-------', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     *remove client information
     *
     * @function removeClient
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  success or Error.
     */
    static async removeClient(req, res) {
        let { user_id, organization_id, language = 'en', is_employee, is_teamlead, is_manager } = req.decoded;
        const { error, value } = ResellerValidation.clientRemoveValidation(req.body);
        const { email: email } = value;
        if (error) {
            return res.json({ code: 404, data: null, message: translate(settingMessages, "2", language), error: error.details[0].message });
        }
        try {
            if(is_employee || is_teamlead || is_manager) {
                let [orgDetails] = await ResellerModel.getOrganizationDetails(organization_id);
                if(!orgDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });
                user_id = orgDetails.user_id
            }
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            // const client = await ResellerModel.removeClient({ email, resellerId: reseller.reseller_id });
            const [ clientDetails ] = await ResellerModel.getClientDetails({ email, resellerId: reseller.reseller_id });
            if (!clientDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            const clientEmployeeAttendanceData = await ResellerModel.getClientEmployeeAttendanceData({ organization_id: clientDetails.organization_id })
            
            const deletedUserIds = [];
            // client's employee data delete part
            if(clientEmployeeAttendanceData && clientEmployeeAttendanceData.length) {
                const formatedData = formatDataForDelete(clientEmployeeAttendanceData);
                for(let i = 0; i < formatedData.length; i++) {
                    let userData = formatedData[i];
                    const deleted = await ResellerModel.deleteUser(userData.user_id);
                    if (deleted.affectedRows !== 0) {
                        deletedUserIds.push(userData.user_id);
                        eventEmitter.emit('delete_employees_data', {
                            organization_id: userData.organization_id,
                            employee_id: userData.employee_id,
                            attendanceIds: userData.attendance_ids,
                            email: userData.email
                        });
                        await redis.delAsync(userData.user_id);
                    }
                }
            }

            //client data delete part
            const deletedClient = await ResellerModel.deleteUser(clientDetails.user_id);
            if (deletedClient.affectedRows !== 0) {
                deletedUserIds.push(clientDetails.user_id);
                await redis.delAsync(clientDetails.user_id);
            }

            actionsTracker(req, 'Users ? successfully deleted.', [ deletedUserIds ]);
            return res.json({ code: 200, data: req.body, message: translate(resellerMessage, "4", language), error: null });
        } catch (err) {
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     *Reseller client stats
     *
     * @function resellerStats
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  success or Error.
     */
    static async clientStats(req, res) {
        let { user_id, organization_id, language = 'en', is_employee, is_teamlead, is_manager } = req.decoded;
        try {
            if(is_employee || is_teamlead || is_manager) {
                let [orgDetails] = await ResellerModel.getOrganizationDetails(organization_id);
                if(!orgDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });
                user_id = orgDetails.user_id
            }
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            let clientStats = await ResellerModel.clientStats({ resellerId: reseller.reseller_id });
            if (clientStats.length === 0) return res.json({ code: 400, data: null, message: translate(groupMessages, "5", language), err: null });

            const orgIds = clientStats.map(x => x.client_organization_id);
            const storage = await ResellerModel.activeStorage({ orgIds });
            clientStats = clientStats.map(x => {
                const obj = storage.find(c => c.organization_id == x.client_organization_id)
                x.reseller_storage = obj ? (obj.reseller ? obj.reseller : false) : false;
                x.expiry = JSON.parse(x.expiry);
                return x;
            });
            return res.json({ code: 200, data: clientStats, message: "data", err: null });
        } catch (err) {
            console.log('-----', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     *Reseller stats
     *
     * @function resellerStats
     * @memberof ResellerController
     * @param {*} req
     * @param {*} res
     * @return  success or Error.
     */
     static async resellerStats(req, res) {
        const { user_id, organization_id, language = 'en' } = req.decoded;
        try {
            let clientUsedLic = { sold_lic: 0 };
            const [reseller] = await ResellerModel.getReseller({ user_id });
            // if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });
            
            const [ resellerDetails ] = await ResellerModel.getResellerOrganizationDetails(organization_id);
            if (!resellerDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });
            if (reseller) [ clientUsedLic ] = await ResellerModel.getClientLicUsed(reseller.reseller_id);
            
            const [{employeeCount}] = await ResellerModel.getCurrentEmployeeCount(organization_id);
            if (employeeCount !== resellerDetails?.current_user_count){
                resellerDetails.current_user_count = employeeCount || 0;
                await ResellerModel.updateOrgLicenseInfo(organization_id, employeeCount);
            }
            
            const availableLicToSell = Number(resellerDetails.total_allowed_user_count) - (Number(clientUsedLic.sold_lic) + Number(resellerDetails.current_user_count));
            const resellerStatsData = {
                a_email: resellerDetails.a_email,
                email: resellerDetails.email,
                first_name: resellerDetails.first_name,
                last_name: resellerDetails.last_name,
                username: resellerDetails.username,
                photo_path: resellerDetails.photo_path,
                date_join: resellerDetails.date_join,
                contact_number: resellerDetails.contact_number,
                address: resellerDetails.address,
                total_licenses_count: resellerDetails.total_allowed_user_count || 0,
                total_licenses_used_by_me: resellerDetails.current_user_count || 0,
                licenses_allocated_to_client: +(clientUsedLic.sold_lic || 0),
                expiry_date: resellerDetails.expiry_date,
                left_over_licenses: +availableLicToSell 
            }
            return res.json({ code: 200, data: resellerStatsData, message: "data", err: null });
        } catch (err) {
            console.log('-----', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }

    /**
     * clientProfile - function to send the client profile details
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async clientProfile(req, res) {
        const { user_id, language = 'en' } = req.decoded;
        try {
            const [ userProfileDetails ] = await ResellerModel.getClientProfileDetails(user_id);
            if (!userProfileDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            return res.json({ code: 200, data: userProfileDetails, message: "Client Profile", err: null });
        } catch (err) {
            console.log('-----', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
       
    }

    /**
     * client edit - function to send the client profile details
     * @param {*} req 
     * @param {*} res 
     * @returns 
     */
    static async clientEdit(req, res) {
        let { user_id, organization_id, language = 'en', is_employee, is_teamlead, is_manager } = req.decoded;
        try {
            const { error, value } = ResellerValidation.validateClientEdit(req.body);
            let { client_id, expiry_date, total_allowed_user_count, notes, reseller_number_client, reseller_id_client } = value;
            if (error) {
                return res.json({ code: 404, data: null, message: translate(settingMessages, "2", language), error: error.details[0].message });
            }
            if(is_employee || is_teamlead || is_manager) {
                let [orgDetails] = await ResellerModel.getOrganizationDetails(organization_id);
                if(!orgDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });
                user_id = orgDetails.user_id
            }
            //reseller details
            const [reseller] = await ResellerModel.getReseller({ user_id });
            if (!reseller) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            // client exist check
            let [ clients ] = await ResellerModel.checkIsResellerClient({ resellerId: reseller.reseller_id, client_id });
            if (!clients) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            // reseller org details
            const [ resellerOrgDetails ]  = await ResellerModel.getResellerOrganizationDetails(organization_id);
            if (!resellerOrgDetails) return res.json({ code: 400, data: null, message: translate(resellerMessage, "2", language), err: "Not Found." });

            // validate expiry date of the client and reseller
            if (
                moment(expiry_date).format("YYYY-MM-DD") < moment(new Date()).format('YYYY-MM-DD') ||
                moment(new Date(resellerOrgDetails.expiry_date)).format("YYYY-MM-DD") < moment(expiry_date).format("YYYY-MM-DD")
            ) {
                return res.json({ code: 400, data: null, message: translate(resellerMessage, "INVALID_EXPIRY_DATE", language), err: null });
            }

            /**
             * client current uses is greater than the total usages count return error msg
             */
            const [ clientData ] = await ResellerModel.getClientProfileDetails(client_id);
            if(
                clientData &&
                total_allowed_user_count &&
                total_allowed_user_count < clientData.current_user_count 
            ) return res.json({  code: 400, data: null, message: translate(resellerMessage, "TOTAL_CANNOT_LESS_THAN_CURRENT", language), err: null });
           
            //validate the reseller licencse
            let [ clientLicUsed ] = await ResellerModel.getClientLicUsed(reseller.reseller_id);
            const availableLicToSell = +resellerOrgDetails.total_allowed_user_count - (+clientLicUsed.sold_lic + +resellerOrgDetails.current_user_count);
            if(
                total_allowed_user_count &&
                !(total_allowed_user_count < clientData.total_allowed_user_count) &&
                !((total_allowed_user_count - clientData.total_allowed_user_count) <= availableLicToSell)
            ) return res.json({ code: 400, data: null, message: translate(resellerMessage, "INSUFFICIENT_LIC", language), err: null });
 
            let settingUpdate;
            if(expiry_date) {
                value.expiry_date = moment(new Date(expiry_date)).format("YYYY-MM-DD");
                let [ clientOrgSettings ] = await ResellerModel.getClientOrgSettings(client_id);
                let orgSetting = JSON.parse(clientOrgSettings.rules);
                orgSetting.pack.expiry = value.expiry_date;
                settingUpdate = orgSetting;
            }
         
            const clientUpdate = await ResellerModel.clientUpdate({client_id, total_allowed_user_count, settingUpdate, notes, reseller_number_client, reseller_id_client });

            if(!clientUpdate) {
                return res.json({ code: 200, data: value, message: translate(resellerMessage, "CLIENT_DETAILS_NOT_UPDATED", language), error: null });
            }
            
            return res.json({ code: 200, data: value, message: translate(resellerMessage, "CLIENT_DETAILS_UPDATED", language), error: null });
        } catch (err) {
            console.log('-------', err);
            return res.json({ code: 400, data: null, message: translate(settingMessages, "5", language), error: err });
        }
    }
}

module.exports.ResellerController = ResellerController;


function formatDataForDelete(clientData) {
    const resultObj = {};

    for(let i = 0; i < clientData.length; i++) {
        const cData = clientData[i];
        if(!resultObj[cData.user_id]) {
            resultObj[cData.user_id] = {
                user_id: cData.user_id,
                organization_id: cData.organization_id,
                employee_id: cData.employee_id,
                email: cData.email,
                attendance_ids: []
            };
        }

        resultObj[cData.user_id].attendance_ids.push(cData.attendance_id);
    }
    return Object.values(resultObj);
}
