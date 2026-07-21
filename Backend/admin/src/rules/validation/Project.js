const Joi = require('joi');

class Project {

    createProject(name, discription, start_date, end_date, manager_id, organization_id,role_id) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            discription: Joi.string().allow(null),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
            manager_id:Joi.array().items(Joi.number().integer().allow(null)),
            organization_id: Joi.number().integer().required(),
            role_id:Joi.number().integer().allow(null)
           });
        var result = Joi.validate({ name, discription, start_date, end_date, manager_id, organization_id ,role_id}, schema);
        return result;
    }

    idValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    updateProject(project_id, name, discription, start_date, end_date, status, progress) {
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().required(),
            status: Joi.number().integer().allow(""),
            name: Joi.string().allow(""),
            discription: Joi.string().allow(null),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
            progress: Joi.number().integer().allow(""),
        });
        var result = Joi.validate({ project_id, name, discription, start_date, end_date, status, progress }, schema);
        return result;
    }

    createOrganazation(name) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            });
        var result = Joi.validate({ name}, schema);
        return result;
    }

    UpdateOrganazation(organization_id, name, status) {
        const schema = Joi.object().keys({
            name: Joi.string().allow(""),
            status: Joi.number().integer().allow(""),
            organization_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ organization_id, name, status }, schema);
        return result;
    }

    createProjectModule(project_id, name, start_date, end_date) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            project_id: Joi.number().integer().required(),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
        });
        var result = Joi.validate({ project_id, name, start_date, end_date }, schema);
        return result;
    }

    getProjectModule(project_id, module_id,status) {
        const schema = Joi.object().keys({
            module_id: Joi.number().integer().allow(""),
            project_id: Joi.number().integer().allow(""),
            status: Joi.number().integer().allow(null),

        });
        var result = Joi.validate({ project_id, module_id ,status}, schema);
        return result;
    }

    UpdateProjectModule(module_id, name, status, start_date, end_date) {
        const schema = Joi.object().keys({
            module_id: Joi.number().integer().required(),
            name: Joi.string().allow(""),
            status: Joi.number().integer().allow(""),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
        });
        var result = Joi.validate({ module_id, name, status, start_date, end_date }, schema);
        return result;
    }

    deleteProjectModule(module_ids, ) {
        const schema = Joi.object().keys({

            module_ids: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid Module is required'),
        });
        var result = Joi.validate({ module_ids }, schema);
        return result;
    }


    getAllOrganization(project_id) {
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().allow(null)
        });
        var result = Joi.validate({ project_id }, schema);
        return result;
    }

    createProjectWithTeam(name, description, start_date, end_date, manager_id,team_id,members_id,role_id,members_role_id){
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            description: Joi.string().allow(null),
            start_date: Joi.date().allow(""),
            end_date: Joi.date().allow(""),
            manager_id: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid ManagerS Id is required'),
            team_id: Joi.array().items(Joi.number().integer().allow(null)),
            members_id: Joi.array().items(Joi.number().integer().allow(null)),
            role_id: Joi.number().integer().allow(null),
            members_role_id: Joi.number().integer().allow(null),
        });
        var result = Joi.validate({name, description, start_date, end_date, manager_id,team_id,members_id ,role_id,members_role_id}, schema);
        return result;
    }

    addProjectMember(member_ids,project_id ,role_id){
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().required(),
            role_id: Joi.number().integer().required(),
            member_ids  : Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid Member Id is required'),
        });
        var result = Joi.validate({member_ids,project_id ,role_id}, schema);
        return result;
    }

    deleteProjectMember(member_ids,project_id) {
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().required(),
            member_ids: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid Member is required'),
        });
        var result = Joi.validate({ member_ids ,project_id}, schema);
        return result;
    }

    updateProjectMember(member_id,project_id,role_id){
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().required(),
            member_id:  Joi.number().integer().required(),
            role_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ member_id ,project_id,role_id}, schema);
        return result;
    }

}
module.exports = new Project;
