const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Silah Schema for Project
const ProjectSchema = new Schema({
    organization_id: { type: Number, required: true },
    title: { type: String, required: true },
    start_date: { type: String, required: true },
    end_date: { type: String, required: true },
    description: { type: String, required: true },
    created_by: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
    assigned_users: [{type: Number}],
    assigned_non_admin_users: [{type: Number}]
}, { timestamps: true });

ProjectSchema.index({ organization_id: 1 });
ProjectSchema.index({ organization_id: 1, title: 1 });

const ProjectSchemaModel = mongoose.model('project', ProjectSchema);




// Silah Schema for Folder
const FolderSchema = new Schema({
    organization_id: { type: Number, required: true },
    name: { type: String, required: true },
    project_id: { type: mongoose.Types.ObjectId, ref: 'project', index: true, required: true },
    created_by: { type: Number, default: null },
    is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

FolderSchema.index({ organization_id: 1 });
FolderSchema.index({ organization_id: 1, name: 1 });
FolderSchema.index({ organization_id: 1, project_id: 1 });

const FolderSchemaModel = mongoose.model('folder', FolderSchema);


// Silah Schema for Folder
const TaskSchema = new Schema({
    organization_id: { type: Number, required: true },
    name: { type: String, required: true },
    project_id: { type: mongoose.Types.ObjectId, ref: 'project', index: true, required: true },
    folder_id: { type: mongoose.Types.ObjectId, ref: 'folder', index: true, required: true },
    assigned_user: { type: Number, default: null },
    status: { type: Number, default: 0 },    // 0 - Not Started, 1 - Started, 2 - Stop/Paused, 3 - Finished
    is_deleted: { type: Boolean, default: false },
    total_working_time: { type: Number, default: false},
    task_working_status: [{
        start_time: { type: Date,  },
        end_time: { type: Date,  },
        productivity_report_id: { type: mongoose.Types.ObjectId },
        productivity_report_second_id: { type: mongoose.Types.ObjectId },
        is_desktop_task: { type: Boolean, default: false},
    }],
    task_finished_time: { type: Date, default: null },
    task_remaining_time: { type: Date, default: null },
    is_desktop_running: { type: Boolean, default: false },
    is_mobile_running: { type: Boolean, default: false },
}, { timestamps: true });

TaskSchema.index({ organization_id: 1 });
TaskSchema.index({ organization_id: 1, name: 1 });
TaskSchema.index({ organization_id: 1, assigned_user: 1 });
// TaskSchema.index({ organization_id: 1, assigned_user: 1, 'task_working_status.start_time': 1, 'task_working_status.end_time': 1 });
TaskSchema.index({ organization_id: 1, assigned_user: 1, 'task_working_status': 1 });

const TaskSchemaModel = mongoose.model('task', TaskSchema);



// Silah Schema for data backup
const BackUpSchema = new Schema({
    organization_id: { type: Number, required: true },
    employee_id: { type: Number, required: true },
    date: { type: String, required: true },
    yyyymmdd: { type: Number, required: true },
    app_usage: [{
        app: { type: String, },
        url: { type: String, },
        start: { type: Number },
        end: { type: Number },
        keystrokes: { type: String },
        title: { type: String }
    }],
    systemTimeUtc: { type: String, required: true },
}, { timestamps: true });

BackUpSchema.index({ organization_id: 1, employee_id: 1, yyyymmdd: 1 });
BackUpSchema.index( { organization_id:1 }, {expireAfterSeconds: 1296000 } ); // 15 Days backups


const BackUpSchemaModel = mongoose.model('silah_db_backup_temp', BackUpSchema);




module.exports = {
    ProjectSchemaModel,
    FolderSchemaModel,
    TaskSchemaModel,
    BackUpSchemaModel
};
