
validateIP = require('validate-ip-node');

const JioValidation=require('./IpWhitelist.validatoion');
const sendResponse = require('../../../utils/myService').sendResponse;
const IpWhitelistModel=require('./IpWhitelist.model');
const actionsTracker = require('../services/actionsTracker');

class IpWhitelistController{

   async addIpWhiteList(req, res) {
       const organization_id = req.decoded.organization_id;
        let ip = req.body.ip;
        let admin_email =req.decoded.email;
        try{
            const validate = JioValidation.add_ip_whitelist(ip);
            if (validate.error) {
                return sendResponse( res ,404, null,'Validation Failed',validate.error.details[0].message);
            }

            let is_valid_ip = validateIP(ip);
            if (!is_valid_ip) {
                return sendResponse( res ,404, null,'IP Validation Failed.',null);
            }
            const check_ip =await IpWhitelistModel.checkIp(ip,organization_id) ;
            if(check_ip.length>0){
                return sendResponse( res ,400, null,'This IP Is Already Added',null);
            }
            const add_ip=await IpWhitelistModel.addIp(organization_id,ip,admin_email);
            if(add_ip){
                if(add_ip.affectedRows>0){
                    req.body.id=add_ip.insertId;
                    actionsTracker(req, 'IP address ? added to whitelist.', [ip]);
                    return sendResponse( res ,200, req.body,'IP Added Successfully',null);
                }else{
                return sendResponse( res ,400, null,'Unable To Add IP',null);
                }
            }else{
                return sendResponse( res ,400, null,'Unable To Add IP',null);
            }
        }catch(err){
            return sendResponse( res ,400, null,'Failed To Add IP',err);
        }
  

        
    }

    async editIp(req,res){
        let ip_id = req.body.ip_id;
        let ip = req.body.ip;
        const organization_id = req.decoded.organization_id;
        try{
            const validate = JioValidation.updateIp(ip,ip_id);
            if (validate.error) {
                return sendResponse( res ,404, null,'Validation Failed',validate.error.details[0].message);
            }

            let is_valid_ip = validateIP(ip);
            if (!is_valid_ip) {
                return sendResponse( res ,404, null,'IP Validation Failed.',null);
            }
            const check_ip =await IpWhitelistModel.checkIp(ip,organization_id) ;
            if(check_ip.length>0){
                return sendResponse( res ,400, null,'This IP Is Already Added',null);
            }

            const update=await IpWhitelistModel.updateIp(ip,ip_id);
            if(update){
                if(update.affectedRows>0){
                    actionsTracker(req, 'IP address %i updated to ?.', [ip_id, ip]);
                    return sendResponse( res ,200, req.body,' Whitelist Ip Edited Successfully.',null);    
                }else{
                    return sendResponse( res ,400, null,'Unable To Update IP',null);    
                }
            }else{
                return sendResponse( res ,400, null,'Failed To Update IP',null);
            }
        }catch(err){
            return sendResponse( res ,400, null,'Failed To Update IP',err);
        }
    }

    async deleteIp(req,res){
       const organization_id = req.decoded.organization_id;
       let ip_id = req.body.ip_id;
       try{
        const validate = JioValidation.idValidation(ip_id);
        if (validate.error) {
            return sendResponse( res ,404, null,'Validation Failed',validate.error.details[0].message);
        }
        const delete_ip=await IpWhitelistModel.deleteIp(ip_id,organization_id);
        if(delete_ip){
            if(delete_ip.affectedRows>0){
                actionsTracker(req, 'IP address %i deleted.', [ip_id]);
                return sendResponse( res ,200, null,'IP Deleted Successfully.',null)
            }else{
                return sendResponse( res ,400, null,'Unable To Delete IP',null); 
            }
        }else{
            return sendResponse( res ,400, null,'Unable To Delete IP',null);    
        }
        }catch(err){
        return sendResponse( res ,400, null,'Failed To Delete IP',err);
       }

    }

    async getIp(req,res){
        const organization_id = req.decoded.organization_id;
        actionsTracker(req, 'Whitelist IP addresses requested.');
        try{
            const validate = JioValidation.skipLimit(req.body.skip,req.body.limit);
            if (validate.error) {
                return sendResponse( res ,404, null,'Validation Failed',validate.error.details[0].message);
            }
            let skip = parseInt(req.body.skip) || 0;
            let limit = parseInt(req.body.limit) || 10;
            const get_ip=await IpWhitelistModel.getIp(skip,limit,organization_id);
            if(get_ip.length>0){
                let total_count = get_ip[0].total_count;
                let has_more_data = (skip + limit) > total_count ? false : true;
                get_ip.map(e => delete e.total_count);

                return sendResponse( res ,200, {
                    total_count: total_count,
                    whitelist_ips: get_ip,
                    has_more_data: has_more_data
                },'No Ips Found',null)
            }else{
                return sendResponse( res ,400, null,'No Ips Found',null);
            }
        }catch(err){
        return sendResponse( res ,400, null,'Failed To Get IP',err);
        }

    }




}
module.exports=new IpWhitelistController;