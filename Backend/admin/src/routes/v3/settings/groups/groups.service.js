const _ = require('underscore');
const MAC_ADDRESS = require('is-mac-address');

const { GroupValidation: Validation } = require('./groups.validation');
const { GroupsModel: Model } = require('./groups.model');
const EventService = require('../../auth/services/event.service');
const { result, filter, constant } = require('underscore');
const { groupMessages } = require("../../../../utils/helpers/LanguageTranslate")


class GroupService {
    

    static async createGroupNew(req, res, next) {
        try {
            let { organization_id, user_id } = req.decoded;
            const language = req.decoded.language;

            const { data, name, note, overwrite } = await Validation.createNewGroup().validateAsync(req.body);
            if(data==null)return res.json({
                code: 400, data: null, message: groupMessages.find(x => x.id === "1")[language] || groupMessages.find(x => x.id === "1")["en"], error: null
            })
            var checkValid = data.filter(x=>x.role_id==null && x.location_id==null && x.department_id==null && x.employee_ids == null)
            if (checkValid.length>0) return res.json({
                code: 400, data: null, message: groupMessages.find(x => x.id === "1")[language] || groupMessages.find(x => x.id === "1")["en"], error: null
            })
            const [group] = await Model.getGroupByName({ name, organization_id }); {
                if (group) return res.json({ code: 409, data: null, message: groupMessages.find(x => x.id === "3")[language] || groupMessages.find(x => x.id === "3")["en"], error: null });
            }
            const [orgnizationSettings] = await Model.orgnizationSetting(organization_id);

            /* Remove Default Web App Blocking while creating new group start */
            orgnizationSettings.rules = JSON.parse(orgnizationSettings?.rules);

            orgnizationSettings.rules.tracking.domain.websiteBlockList = [];
            orgnizationSettings.rules.tracking.domain.appBlockList = "";

            orgnizationSettings.rules = JSON.stringify(orgnizationSettings?.rules);
            /* Remove Default Web App Blocking while creating new group end */

            const roleWithLocDeptEmp = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id !== null && x.employee_ids !== null);
            const roleWithDeptEmp = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id !== null && x.employee_ids !== null);
            const roleWithLocEmp = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id == null && x.employee_ids !== null);
            const roleWithLocDept = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id !== null && x.employee_ids == null);
            const roleWithLoc = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id == null && x.employee_ids == null);
            const roleWithDep = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id !== null && x.employee_ids == null);
            const roleWithEmp = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id == null && x.employee_ids !== null);
            const role = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id == null && x.employee_ids == null);

            const locWithDepEmp = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id !== null && x.employee_ids !== null);
            const locWithDep = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id !== null && x.employee_ids == null);
            const locWithEmp = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id == null && x.employee_ids !== null);
            const loc = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id == null && x.employee_ids == null);


            const depWithEmp = data.filter(x => x.role_id == null && x.location_id == null && x.department_id !== null && x.employee_ids !== null);
            const dep = data.filter(x => x.role_id == null && x.location_id == null && x.department_id !== null && x.employee_ids == null);
            const emp = data.filter(x => x.role_id == null && x.location_id == null && x.department_id == null && x.employee_ids !== null);
            var empIds = [];
            let group_data = [];

            /*all role combination without employees*/
            for (const l of roleWithLocDept) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.location_id=${l.location_id} AND e.department_id=${l.department_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, l.department_id, l.role_id])
            }
            for (const l of roleWithLoc) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.location_id=${l.location_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, null, l.role_id])
            }
            for (const l of roleWithDep) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.department_id=${l.department_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, l.department_id, l.role_id])
            }
            for (const l of role) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, null, l.role_id])
            }

            /*all location combination without employees*/
            for (const l of locWithDep) {
                const e = await Model.employees({ select: `id`, where: `location_id=${l.location_id} AND department_id=${l.department_id} AND organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, l.department_id, null])
            }

            for (const l of loc) {
                const e = await Model.employees({ select: `id`, where: `location_id=${l.location_id} AND organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, null, null])
            }

            /*all departments combination without employees*/

            for (const l of dep) {
                const e = await Model.employees({ select: `id`, where: `department_id=${l.department_id} AND organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, l.department_id, null])
            }

            /*all role combination with employees*/
            for (const l of roleWithLocDeptEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, l.department_id, l.role_id]));
            }
            for (const l of roleWithLocEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, null, l.role_id]));
            }
            for (const l of roleWithDeptEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, l.department_id, l.role_id]));
            }
            for (const l of roleWithEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, null, l.role_id]));
            }

            /*location combination with employees*/

            for (const l of locWithDepEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, l.department_id, null]));
            }
            for (const l of locWithEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, null, null]));
            }
            /*department with employees*/
            for (const l of depWithEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, l.department_id, null]));
            }
            /*employees*/
            for (const l of emp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, null, null]));
            }
            empIds = _.uniq(empIds);
            //check if the employee id is assigned to other group
            if (empIds.length > 0) {
                var unlistedEmployees = await Model.checkEmployeeGroup(empIds);
                const unlistedEmployeeIds = _.pluck(unlistedEmployees, 'id');
                if (unlistedEmployees.length > 0 && !overwrite) return res.json({
                    code: 205, data: unlistedEmployees, message: groupMessages.find(x => x.id === "4")[language] || groupMessages.find(x => x.id === "4")["en"], error: null
                })
                else if(unlistedEmployees.length > 0 && overwrite){
                    await Model.removeUserFromGroup(unlistedEmployeeIds);
                    await Model.updateEmployeeSettings({ set: `custom_tracking_rule='${orgnizationSettings.rules}', tracking_rule_type =1 , group_id=null`, where: `id IN(${unlistedEmployeeIds})` });

                }
                const inserted = await Model.createGroup({ organization_id, user_id, name, note, rules: orgnizationSettings.rules });
                
                group_data.map(x => x[0] = inserted.insertId)
                const audience = await Model.addAudience({ group_data });
                await Model.updateEmployeeSettings({ set: `custom_tracking_rule='${orgnizationSettings.rules}', tracking_rule_type =2 , group_id=${inserted.insertId}`, where: `id IN(${empIds}) AND tracking_rule_type IN (1,3)` });
                const groups = await Model.listGroup({ organization_id:organization_id, skip: 0, limit: 1, group_id: inserted.insertId});
                if (groups.length === 0) return res.json({ code: 400, data: null, message: groupMessages.find(x => x.id === "5")[language] || groupMessages.find(x => x.id === "5")["en"], error: null });

                const grp_id = _.pluck(groups, 'group_id');
                
                let group_audience = await Model.listGroupAudience({ grp_id });
                let result = [];
                group_audience.map(x => { if (x.employee_id == null) { result.push(x) } });
                // result.map(x=>x.employees='[]')
                group_audience = group_audience.filter(x => x.employee_id);
                let newdata = []
                group_audience.map(x => {
                    const temp = newdata.find(element => (element.location_id === x.location_id && element.role_id === x.role_id && element.department_id === x.department_id))
                    if (!temp) {
                        newdata.push(x);
                    }
                })
                newdata.map(x => {
                    let temp = group_audience.filter(t => t.location_id == x.location_id && t.department_id == x.department_id && t.role_id == x.role_id);
                    temp = temp.map(itr => ({employee_id:itr.employee_id,full_name:itr.full_name}))
                    result.push({ ...x, employees: temp })
                })
                const final_data={
                    organization_id: groups[0].organization_id,
                    group_id: groups[0].group_id,
                    name: groups[0].name,
                    note: groups[0].note,
                    rules: groups[0].rules,
                    group_details:result
                }
                return res.json({
                    code: 200, data:final_data, message: groupMessages.find(x => x.id === "6")[language] || groupMessages.find(x => x.id === "6")["en"], error: null
                })
            }
            return res.json({
                code: 400, data:null, message: groupMessages.find(x => x.id === "7")[language] || groupMessages.find(x => x.id === "7")["en"], error: null
            })

            
        } catch (err) {
            next(err)
        }
    }

    static async listGroups(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const { skip, limit, group_id,sortOrder,name,sortColumn } = await Validation.listGroup().validateAsync(req.query);
            const groups = await Model.listGroup({ organization_id, skip, limit,group_id,sortOrder,name,sortColumn });
            if (groups.length === 0) return res.json({ code: 400, data: null, message: groupMessages.find(x => x.id === "5")[language] || groupMessages.find(x => x.id === "5")["en"], error: null });
            const [count] = await Model.listGroupCount({ organization_id,group_id,name });
            // const group_ids = _.pluck(groups, 'group_id');           
            let final_data=[];
            for (const grp_id of groups){
                let group_audience = await Model.listGroupAudience({ grp_id:grp_id.group_id });
                let result = [];
                group_audience.map(x => { if (x.employee_id == null) { result.push(x) } });
                group_audience = group_audience.filter(x => x.employee_id);
                let newdata = []
                group_audience.map(x => {
                    const temp = newdata.find(element => (element.location_id === x.location_id && element.role_id === x.role_id && element.department_id === x.department_id))
                    if (!temp) {
                        newdata.push(x);
                    }
                })
                newdata.map(x => {
                    let temp = group_audience.filter(t => t.location_id == x.location_id && t.department_id == x.department_id && t.role_id == x.role_id);
                    temp = temp.map(itr => ({employee_id:itr.employee_id,full_name:itr.full_name}))
                    result.push({ ...x, employees: temp })
                })
            
                final_data.push({
                    organization_id: grp_id.organization_id,
                    group_id: grp_id.group_id,
                    name: grp_id.name,
                    note: grp_id.note,
                    rules: grp_id.rules,
                    group_details:result.filter(x=>x.group_id==grp_id.group_id)
                })
            }
            return res.json({
                code: 200, ...count,data:final_data, message: groupMessages.find(x => x.id === "8")[language] || groupMessages.find(x => x.id === "8")["en"], error: null
            })
            }

        catch (err) {
            next(err);
        }
    }

    static async deleteGroup(req, res, next) {
        try {
            let { organization_id, user_id } = req.decoded;
            const language = req.decoded.language;

            const [orgnizationSettings] = await Model.orgnizationSetting(organization_id);
            const { group_id } = await Validation.delete().validateAsync(req.body);
            await Model.updateEmplyeeSetting({ set: `tracking_rule_type=1,custom_tracking_rule='${orgnizationSettings.rules}'`, where: `group_id=${group_id}` });
            const deletedGroups = await Model.deleteGroups({ group_id, organization_id });
            res.json({ code: 200, data: req.body, message: groupMessages.find(x => x.id === "9")[language] || groupMessages.find(x => x.id === "9")["en"], error: null });

        } catch (err) {
            next(err);
        }
    }

    static async editGroup(req, res, next) {
        try {
            let { organization_id, user_id } = req.decoded;
            const language = req.decoded.language;

            const { data, name, note, overwrite ,group_id} = await Validation.edit().validateAsync(req.body);
            if(data==null)return res.json({
                code: 400, data: null, message: groupMessages.find(x => x.id === "1")[language] || groupMessages.find(x => x.id === "1")["en"], error: null
            })
            var checkValid = data.filter(x=>x.role_id==null && x.location_id==null && x.department_id==null && x.employee_ids == null)
            if (checkValid.length>0) return res.json({
                code: 400, data: null, message: groupMessages.find(x => x.id === "1")[language] || groupMessages.find(x => x.id === "1")["en"], error: null
            })
            /**check group name exits */
         
            if(name!=null){
                const [group] = await Model.getGroupName({ group_id,organization_id });
                if(group.name!=name) {
                    const [new_name] = await Model.checkGroupNameAlreadyExits(name,organization_id,group_id);
                    if(new_name!=null) return res.json({
                        code: 409, data: null, message: groupMessages.find(x => x.id === "10")[language] || groupMessages.find(x => x.id === "10")["en"], error: null
                    })
                    await Model.updateGroupName({name,group_id,organization_id})
                }
            }   
            await Model.updateGroupNote({note,group_id,organization_id})

            /*get all employees from group*/
            
            const [orgnizationSettings] = await Model.orgnizationSetting(organization_id);
            const [groupSettings] = await Model.groupSetting(group_id);
            const oldEmps = await Model.employees({ select: `id`, where: `organization_id=${organization_id} AND group_id=${group_id}` });
            const oldEmpsList = _.pluck(oldEmps, 'id');
            // await Model.updateEmplyeeSetting({ set: `tracking_rule_type=1,custom_tracking_rule='${orgnizationSettings.rules}'`, where: `group_id=${group_id}` });
            // await Model.deleteGroupsAudiance({ where: `group_id=${group_id}` });
            const roleWithLocDeptEmp = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id !== null && x.employee_ids !== null);
            const roleWithDeptEmp = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id !== null && x.employee_ids !== null);
            const roleWithLocEmp = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id == null && x.employee_ids !== null);
            const roleWithLocDept = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id !== null && x.employee_ids == null);
            const roleWithLoc = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id == null && x.employee_ids == null);
            const roleWithDep = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id !== null && x.employee_ids == null);
            const roleWithEmp = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id == null && x.employee_ids !== null);
            const role = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id == null && x.employee_ids == null);

            const locWithDepEmp = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id !== null && x.employee_ids !== null);
            const locWithDep = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id !== null && x.employee_ids == null);
            const locWithEmp = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id == null && x.employee_ids !== null);
            const loc = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id == null && x.employee_ids == null);


            const depWithEmp = data.filter(x => x.role_id == null && x.location_id == null && x.department_id !== null && x.employee_ids !== null);
            const dep = data.filter(x => x.role_id == null && x.location_id == null && x.department_id !== null && x.employee_ids == null);
            const emp = data.filter(x => x.role_id == null && x.location_id == null && x.department_id == null && x.employee_ids !== null);
            var empIdsNew = [];
            let group_data = [];

            /*all role combination without employees*/
            for (const l of roleWithLocDept) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.location_id=${l.location_id} AND e.department_id=${l.department_id} AND e.organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, l.department_id, l.role_id])
            }
            for (const l of roleWithLoc) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.location_id=${l.location_id} AND e.organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, null, l.role_id])
            }
            for (const l of roleWithDep) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.department_id=${l.department_id} AND e.organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, l.department_id, l.role_id])
            }
            for (const l of role) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, null, l.role_id])
            }

            /*all location combination without employees*/
            for (const l of locWithDep) {
                const e = await Model.employees({ select: `id`, where: `location_id=${l.location_id} AND department_id=${l.department_id} AND organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, l.department_id, null])
            }

            for (const l of loc) {
                const e = await Model.employees({ select: `id`, where: `location_id=${l.location_id} AND organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, null, null])
            }

            /*all departments combination without employees*/

            for (const l of dep) {
                const e = await Model.employees({ select: `id`, where: `department_id=${l.department_id} AND organization_id=${organization_id}` });
                empIdsNew.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, l.department_id, null])
            }

            /*all role combination with employees*/
            for (const l of roleWithLocDeptEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, l.department_id, l.role_id]));
            }
            for (const l of roleWithLocEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, null, l.role_id]));
            }
            for (const l of roleWithDeptEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, l.department_id, l.role_id]));
            }
            for (const l of roleWithEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, null, l.role_id]));
            }

            /*location combination with employees*/

            for (const l of locWithDepEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, l.department_id, null]));
            }
            for (const l of locWithEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, null, null]));
            }
            /*department with employees*/
            for (const l of depWithEmp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, l.department_id, null]));
            }
            /*employees*/
            for (const l of emp) {
                empIdsNew = empIdsNew.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, null, null]));
            }
            empIdsNew = _.uniq(empIdsNew);
            empIdsNew = empIdsNew.map(item=>+item)
            const toBeDeletedEmps = oldEmpsList.filter(item => !empIdsNew.includes(item));
            const toBeinsertedEmps = empIdsNew.filter(item => !oldEmpsList.includes(item));

            if (toBeinsertedEmps.length > 0) {
                var unlistedEmployees = await Model.checkEmployeeGroup(toBeinsertedEmps);
                const unlistedEmployeeIds = _.pluck(unlistedEmployees, 'id');
                if (unlistedEmployees.length > 0 && !overwrite) return res.json({
                    code: 205, data: unlistedEmployees, message: groupMessages.find(x => x.id === "11")[language] || groupMessages.find(x => x.id === "11")["en"], error: null
                })
                // const inserted = await Model.createGroup({ organization_id, user_id, name, note, rules: orgnizationSettings.rules });
                else if(unlistedEmployees.length > 0 && overwrite){
                    await Model.removeUserFromGroup(unlistedEmployeeIds);
                    await Model.updateEmployeeSettings({ set: `custom_tracking_rule='${groupSettings.rules}', tracking_rule_type =2 , group_id=${group_id}`, where: `id IN(${unlistedEmployeeIds})` });
                }
                await Model.updateEmployeeSettings({ set: `custom_tracking_rule='${groupSettings.rules}', tracking_rule_type =2 , group_id=${group_id}`, where: `id IN(${toBeinsertedEmps}) AND tracking_rule_type IN (1,3)` });
             }
             if (toBeDeletedEmps.length > 0) {
                 await Model.updateEmplyeeSetting({ set: `tracking_rule_type=1,custom_tracking_rule='${orgnizationSettings.rules}', group_id=null`, where: `group_id=${group_id} AND id IN(${toBeDeletedEmps})` });
             }
             
             await Model.deleteGroupsAudiance({ where: `group_id=${group_id}` });
             
            group_data.map(x => x[0] = group_id)
            const audience = await Model.addAudience({ group_data });

            const groups = await Model.listGroup({ organization_id:organization_id, skip: 0, limit: 1, group_id: group_id});
            if (groups.length === 0) return res.json({ code: 400, data: null, message: groupMessages.find(x => x.id === "5")[language] || groupMessages.find(x => x.id === "5")["en"], error: null });

            const grp_id = _.pluck(groups, 'group_id');
            
            let group_audience = await Model.listGroupAudience({ grp_id });
            let result = [];
            group_audience.map(x => { if (x.employee_id == null) { result.push(x) } });
            // result.map(x=>x.employees='[]')
            group_audience = group_audience.filter(x => x.employee_id);
            let newdata = []
            group_audience.map(x => {
                const temp = newdata.find(element => (element.location_id === x.location_id && element.role_id === x.role_id && element.department_id === x.department_id))
                if (!temp) {
                    newdata.push(x);
                }
            })
            newdata.map(x => {
                let temp = group_audience.filter(t => t.location_id == x.location_id && t.department_id == x.department_id && t.role_id == x.role_id);
                temp = temp.map(itr => ({employee_id:itr.employee_id,full_name:itr.full_name}))
                result.push({ ...x, employees: temp })
            })
            const final_data={
                organization_id: groups[0].organization_id,
                group_id: groups[0].group_id,
                name: groups[0].name,
                note: groups[0].note,
                rules: groups[0].rules,
                group_details:result
            }
            return res.json({
                code: 200, data:final_data, message: groupMessages.find(x => x.id === "12")[language] || groupMessages.find(x => x.id === "12")["en"], error: null
            })
        } catch (err) {
            next(err);
        }
        
    }

    static async updateGroupCustomSetting(req, res, next) {
        try {
            const { organization_id } = req.decoded;
            const language = req.decoded.language;

            const { group_id, settings } = await Validation.updateGroupCustomSetting().validateAsync(req.body);
            const [group] = await Model.listGroup({ organization_id, skip: 0, limit: 1, group_id });

            let data = JSON.parse(group.rules);

            let track_data = settings;

            if (track_data.system) {
                data.system.type = track_data.system.type;
                data.system.visibility = track_data.system.visibility;
            }
            if (track_data.screenshot) {
                data.screenshot.frequencyPerHour = track_data.screenshot.frequencyPerHour || data.screenshot.frequencyPerHour;
                data.screenshot.employeeAccessibility = track_data.screenshot.employeeAccessibility;
                data.screenshot.employeeCanDelete = track_data.screenshot.employeeCanDelete;
            }
            if (track_data.features) {
                data.features.application_usage = track_data.features.application_usage || data.features.application_usage;
                data.features.keystrokes = track_data.features.keystrokes || data.features.keystrokes;
                data.features.web_usage = track_data.features.web_usage || data.features.web_usage;
                data.features.block_websites = track_data.features.block_websites || data.features.block_websites;
                data.features.screenshots = track_data.features.screenshots || data.features.screenshots;
            }
            data.breakInMinute = track_data.breakInMinute || data.breakInMinute;
            data.idleInMinute = track_data.idleInMinute || data.idleInMinute;
            if (track_data.trackingMode) {
                var validate = Validation.empTrackingModeValidation().validateAsync({ trackingMode: track_data.trackingMode });
                if (validate.error) return res.json({ code: 404, data: null, message: "Validation failed", error: validate.error.details[0].message });
                data.trackingMode = track_data.trackingMode || data.trackingMode;
            }
            if (track_data.tracking) {
                if (track_data.tracking.unlimited) {
                    data.tracking.unlimited.day = track_data.tracking.unlimited.day;
                }
                if (track_data.tracking.fixed) {
                    if (track_data.tracking.fixed.mon) {
                        data.tracking.fixed.mon.status = track_data.tracking.fixed.mon.status;
                        if (track_data.tracking.fixed.mon.time) {
                            data.tracking.fixed.mon.time.start = track_data.tracking.fixed.mon.time.start || data.tracking.fixed.mon.time.start;
                            data.tracking.fixed.mon.time.end = track_data.tracking.fixed.mon.time.end || data.tracking.fixed.mon.time.end;
                        }
                    }
                    if (track_data.tracking.fixed.tue) {
                        data.tracking.fixed.tue.status = track_data.tracking.fixed.tue.status;
                        if (track_data.tracking.fixed.tue.time) {
                            data.tracking.fixed.tue.time.start = track_data.tracking.fixed.tue.time.start || data.tracking.fixed.tue.time.start;
                            data.tracking.fixed.tue.time.end = track_data.tracking.fixed.tue.time.end || data.tracking.fixed.tue.time.end;
                        }
                    }
                    if (track_data.tracking.fixed.wed) {
                        data.tracking.fixed.wed.status = track_data.tracking.fixed.wed.status;
                        if (track_data.tracking.fixed.wed.time) {
                            data.tracking.fixed.wed.time.start = track_data.tracking.fixed.wed.time.start || data.tracking.fixed.wed.time.start;
                            data.tracking.fixed.wed.time.end = track_data.tracking.fixed.wed.time.end || data.tracking.fixed.wed.time.end;
                        }
                    }
                    if (track_data.tracking.fixed.thu) {
                        data.tracking.fixed.thu.status = track_data.tracking.fixed.thu.status;
                        if (track_data.tracking.fixed.thu.time) {
                            data.tracking.fixed.thu.time.start = track_data.tracking.fixed.thu.time.start || data.tracking.fixed.thu.time.start;
                            data.tracking.fixed.thu.time.end = track_data.tracking.fixed.thu.time.end || data.tracking.fixed.thu.time.end;
                        }
                    }
                    if (track_data.tracking.fixed.fri) {
                        data.tracking.fixed.fri.status = track_data.tracking.fixed.fri.status;
                        if (track_data.tracking.fixed.fri.time) {
                            data.tracking.fixed.fri.time.start = track_data.tracking.fixed.fri.time.start || data.tracking.fixed.fri.time.start;
                            data.tracking.fixed.fri.time.end = track_data.tracking.fixed.fri.time.end || data.tracking.fixed.fri.time.end;
                        }
                    }
                    if (track_data.tracking.fixed.sat) {
                        data.tracking.fixed.sat.status = track_data.tracking.fixed.sat.status;
                        if (track_data.tracking.fixed.sat.time) {
                            data.tracking.fixed.sat.time.start = track_data.tracking.fixed.sat.time.start || data.tracking.fixed.sat.time.start
                            data.tracking.fixed.sat.time.end = track_data.tracking.fixed.sat.time.end || data.tracking.fixed.sat.time.end;
                        }
                    }
                    if (track_data.tracking.fixed.sun) {
                        data.tracking.fixed.sun.status = track_data.tracking.fixed.sun.status;
                        if (track_data.tracking.fixed.sun.time.start) {
                            data.tracking.fixed.sun.time.start = track_data.tracking.fixed.sun.time.start || data.tracking.fixed.sun.time.start
                            data.tracking.fixed.sun.time.end = track_data.tracking.fixed.sun.time.end || data.tracking.fixed.sun.time.end;
                        }
                    }
                }
                if (track_data.tracking.networkBased) {
                    data.tracking.networkBased.networkName = track_data.tracking.networkBased.networkName || data.tracking.networkBased.networkName
                    if (track_data.tracking.networkBased.networkMac) {
                        if (MAC_ADDRESS.isMACAddress(track_data.tracking.networkBased.networkMac.replace(/-/g, ":")) === false) return res.json({ code: 404, data: null, message: 'Validation failed', error: 'Invalid MAC address' });
                        data.tracking.networkBased.networkMac = track_data.tracking.networkBased.networkMac || data.tracking.networkBased.networkMac
                    }
                }
            }
            if (track_data.task) {
                data.task.employeeCanCreateTask = track_data.task.employeeCanCreateTask;
            }
            const updated = await Model.updateGroup({ group_id, organization_id, rules: JSON.stringify(data) });

            res.json({ code: 200, data: req.body, message: groupMessages.find(x => x.id === "13")[language] || groupMessages.find(x => x.id === "13")["en"], error: null })
            let empIds = [];
            const group_audience = await Model.listGroupAudience({ group_ids: [group_id] });
            empIds.push(..._.pluck(group_audience, 'employee_id').filter(x => x !== null));
            
            if (empIds.length > 0) {
                await Model.updateEmplyeeSetting({ set: `custom_tracking_rule='${JSON.stringify(data)}',	tracking_rule_type=4`, where: `id IN(${empIds})` })
            }
            this.updateRedis({ empIds });

        } catch (err) {
            next(err);
        }
    }

    static async updateRedis({ empIds }) {
        let i = empIds.length;
        while (i > 0) {
            i--;
            EventService.emit('update-employee-redis-data-by-employee_id', empIds[i]);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    static async getAllEmployees(data){
            const roleWithLocDeptEmp = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id !== null && x.employee_ids !== null);
            const roleWithDeptEmp = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id !== null && x.employee_ids !== null);
            const roleWithLocEmp = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id == null && x.employee_ids !== null);
            const roleWithLocDept = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id !== null && x.employee_ids == null);
            const roleWithLoc = data.filter(x => x.role_id !== null && x.location_id !== null && x.department_id == null && x.employee_ids == null);
            const roleWithDep = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id !== null && x.employee_ids == null);
            const roleWithEmp = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id == null && x.employee_ids !== null);
            const role = data.filter(x => x.role_id !== null && x.location_id == null && x.department_id == null && x.employee_ids == null);

            const locWithDepEmp = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id !== null && x.employee_ids !== null);
            const locWithDep = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id !== null && x.employee_ids == null);
            const locWithEmp = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id == null && x.employee_ids !== null);
            const loc = data.filter(x => x.role_id == null && x.location_id !== null && x.department_id == null && x.employee_ids == null);


            const depWithEmp = data.filter(x => x.role_id == null && x.location_id == null && x.department_id !== null && x.employee_ids !== null);
            const dep = data.filter(x => x.role_id == null && x.location_id == null && x.department_id !== null && x.employee_ids == null);
            const emp = data.filter(x => x.role_id == null && x.location_id == null && x.department_id == null && x.employee_ids !== null);
            var empIds = [];
            let group_data = [];

            /*all role combination without employees*/
            for (const l of roleWithLocDept) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.location_id=${l.location_id} AND e.department_id=${l.department_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, l.department_id, l.role_id])
            }
            for (const l of roleWithLoc) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.location_id=${l.location_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, null, l.role_id])
            }
            for (const l of roleWithDep) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.department_id=${l.department_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, l.department_id, l.role_id])
            }
            for (const l of role) {
                const e = await Model.roleEmployees({ select: `e.id`, where: `ur.role_id=${l.role_id} AND e.organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, null, l.role_id])
            }

            /*all location combination without employees*/
            for (const l of locWithDep) {
                const e = await Model.employees({ select: `id`, where: `location_id=${l.location_id} AND department_id=${l.department_id} AND organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, l.department_id, null])
            }

            for (const l of loc) {
                const e = await Model.employees({ select: `id`, where: `location_id=${l.location_id} AND organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, l.location_id, null, null])
            }

            /*all departments combination without employees*/

            for (const l of dep) {
                const e = await Model.employees({ select: `id`, where: `department_id=${l.department_id} AND organization_id=${organization_id}` });
                empIds.push(..._.pluck(e, 'id'))
                group_data.push([null, null, null, l.department_id, null])
            }

            /*all role combination with employees*/
            for (const l of roleWithLocDeptEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, l.department_id, l.role_id]));
            }
            for (const l of roleWithLocEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, null, l.role_id]));
            }
            for (const l of roleWithDeptEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, l.department_id, l.role_id]));
            }
            for (const l of roleWithEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, null, l.role_id]));
            }

            /*location combination with employees*/

            for (const l of locWithDepEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, l.department_id, null]));
            }
            for (const l of locWithEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, l.location_id, null, null]));
            }
            /*department with employees*/
            for (const l of depWithEmp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, l.department_id, null]));
            }
            /*employees*/
            for (const l of emp) {
                empIds = empIds.concat(l.employee_ids);
                l.employee_ids.map(id => group_data.push([null, id, null, null, null]));
            }
            empIds = _.uniq(empIds);
            return empIds;
            
    }

}

module.exports.GroupService = GroupService;
