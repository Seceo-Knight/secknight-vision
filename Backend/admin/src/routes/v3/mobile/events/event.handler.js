const { EventEmitter } = require('events');
EventEmitter.defaultMaxListeners = 0;
const eventEmitter = new EventEmitter();

const mySql = require('../../../../database/MySqlConnection').getInstance();

const { TaskSchemaModel } = require('../../../../models/silah_db.schema');
const _ = require('underscore');

const moment = require('moment');

//Create an event handler:
const updateMobileLoginTime = async ({employee_id, last_login_time, user_agent}) => {
    try {
        let device = user_agent.includes("Darwin") || user_agent.includes("silahTTS") ? "iOS" : user_agent.includes("okhttp") ? "Android" : "";
        let query = `UPDATE employees SET mobile_last_activity="${moment(last_login_time).format('YYYY-MM-DD HH:mm:ss')}", mobile_os = "${device}" WHERE id=${employee_id}`;
        return await mySql.query(query);
    } catch (error) {
        console.log("Error in updateMobileLoginTime -- "+ employee_id);
    }
}

const projectDeletedUpdateTask = async(project_id) => {
    try {
        console.log("Project deleted", project_id);
        let tasks = await TaskSchemaModel.find({ project_id: project_id });
        let taskIds = _.pluck(tasks, '_id');
        await TaskSchemaModel.updateMany(
            { _id: { $in: taskIds } },
            { $set: { is_deleted: true } });
    }
    catch (error) {
        console.log("Error in projectDeletedUpdateTask -- "+ project_id);
    }
}



eventEmitter.on('update-mobile-login', updateMobileLoginTime);
eventEmitter.on('project-deleted-task-update', projectDeletedUpdateTask);
module.exports = eventEmitter;