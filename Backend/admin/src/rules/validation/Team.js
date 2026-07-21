
const Joi = require('joi');

class Team {

    createTeam(name, discription, status,user_ids,team_lead_ids) {
        const schema = Joi.object().keys({
            name: Joi.string().required(),
            discription: Joi.string().allow(null),
            status: Joi.number().integer().required(),
          
            user_ids: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid User id is required'),
            team_lead_ids: Joi.array().items(Joi.number().integer().allow(null)),
            
        });
        var result = Joi.validate({ name, discription, status ,user_ids,team_lead_ids}, schema);
        return result;
    }


    idValidation(id) {
        const schema = Joi.object().keys({
            id: Joi.number().integer().required()
        });
        var result = Joi.validate({ id }, schema);
        return result;
    }

    addUsersToTeam(team_id, user_ids, role_id) {
        const schema = Joi.object().keys({
            user_ids: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid User id is required'),
            team_id: Joi.number().integer().required(),
            role_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ team_id, user_ids, role_id }, schema);
        return result;
    }

    DeleteTemUsers(team_id, user_ids) {
        const schema = Joi.object().keys({
            user_ids: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid User id is required'),
            team_id: Joi.number().integer().required(),
        });
        var result = Joi.validate({ team_id, user_ids }, schema);
        return result;
    }

    updateUsersTeam(team_id, user_id, reason, status,role_id) {
        const schema = Joi.object().keys({
            user_id: Joi.number().integer().required(),
            team_id: Joi.number().integer().required(),
            status: Joi.number().integer().allow(null),
            reason: Joi.string().allow(""),
            role_id: Joi.number().integer().allow(null),

        });
        var result = Joi.validate({ team_id, user_id, reason, status }, schema);
        return result;
    }

    addTeamToProject(team_id, project_id) {
        const schema = Joi.object().keys({
            project_id: Joi.number().integer().required(),
            team_id: Joi.array().items(Joi.number().integer().required()).error(error => 'Atleast One Valid Team is required'),
        });
        var result = Joi.validate({ team_id, project_id }, schema);
        return result;
    }
    getTeam(team_id) {
        const schema = Joi.object().keys({
            team_id: Joi.number().integer().allow(null),
        });
        var result = Joi.validate({ team_id }, schema);
        return result;
    }

    getTeamsFromProject(project_id) {
        const schema = Joi.object().keys({
       project_id: Joi.number().integer().allow(null),
        });
        var result = Joi.validate({ project_id }, schema);
        return result;
    }


}
module.exports = new Team;

