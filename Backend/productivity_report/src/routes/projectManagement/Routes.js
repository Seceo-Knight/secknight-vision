const router = require('express').Router();

const Organazation = require('./organazation/OrganationService');
const Project = require('./project/Project');
const TeamService = require('./team/TeamService');
const Todo = require('./todos/Todos');
const Timesheet = require('./timesheet/Timesheet');


class ProjectManagementRoute {

    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        //organazation
        // this.myRoutes.post('/create-organization', Organazation.createOrganazation);
        // this.myRoutes.post('/get-organization', Organazation.getSingleOrgnazation);
        // this.myRoutes.delete('/delete-organization', Organazation.deleteOrganization);
        // this.myRoutes.put('/update-organization', Organazation.updateOrganization);

        // Project
        // this.myRoutes.post('/create-internal-projects', Project.createProject);
        this.myRoutes.post('/get-project', Project.getSingleProject);
        this.myRoutes.put('/update-internal-project', Project.updateProject);
        this.myRoutes.delete('/delete-project', Project.deleteProject);
        this.myRoutes.post('/create-project-module', Project.createProjectModule);
        this.myRoutes.post('/get-project-module', Project.getProjectModule);
        this.myRoutes.put('/update-project-module', Project.updateModule);
        this.myRoutes.delete('/delete-project-module', Project.deleteProjectModule);
        this.myRoutes.post('/create-internal-projects-team', Project.createProjectWithTeam);
        this.myRoutes.post('/add-project-members', Project.addProjectMember);
        this.myRoutes.delete('/delete-project-members', Project.deleteProjectMember);
        this.myRoutes.put('/update-project-members', Project.updateProjectMember);

        //Todo
        this.myRoutes.post('/create-todo', Todo.createTodos);
        this.myRoutes.post('/get-todo', Todo.fetchTodo);
        this.myRoutes.delete('/delete-todo', Todo.deleteTodo);
        this.myRoutes.put('/update-todo', Todo.UpdateTodo);

        //Team
        this.myRoutes.post('/create-team', TeamService.createTeam);
        this.myRoutes.post('/get-team', TeamService.getTeam);
        this.myRoutes.put('/update-team', TeamService.updateTeam);
        this.myRoutes.delete('/delete-team', TeamService.deleteTeam);
        this.myRoutes.post('/add-users-to-team', TeamService.addUsersToTeam);
        this.myRoutes.post('/get-users-team', TeamService.getUsersFromTeam);
        this.myRoutes.delete('/delete-users-from-team', TeamService.deleteUsesFromTeam);
        this.myRoutes.put('/update-users-from-team', TeamService.updateUsersTeam);
        this.myRoutes.post('/add-team-to-project', TeamService.addTeamToProject);
        this.myRoutes.post('/get-team-from-project', TeamService.getTeamsFromProject);
        this.myRoutes.delete('/delete-team-from-project', TeamService.deleteTeamsFromProject);
        // this.myRoutes.post('/get-project-members', TeamService.getProjectMembers);
        this.myRoutes.get('/get-project-members/:project_id', TeamService.getProjectMembers);
        



        // Timesheets 
        this.myRoutes.post('/create-timesheet', Timesheet.createTimesheet);
        this.myRoutes.post('/get-timesheet', Timesheet.getTimesheet);
        this.myRoutes.put('/update-timesheet', Timesheet.updateTimesheet);
        this.myRoutes.delete('/delete-timesheet', Timesheet.deleteTimesheet);
    }

    getRouters() {
        return this.myRoutes;
    }

}
module.exports = new ProjectManagementRoute;
