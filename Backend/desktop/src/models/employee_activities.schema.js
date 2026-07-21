const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const empActivitiesSchema = new Schema({
    // id: { type: Number, required: true, unique: true },
    attendance_id: { type: Number, default: null },
    application_id: { type: Number, default: null },
    domain_id: { type: Number, default: null },
    url: { type: String, default: null },
    task_id: { type: Number, default: null },
    project_id: { type: Number, default: null },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },
    total_duration: { type: Number, default: 0 },
    active_seconds: { type: Number, default: 0 },
    keystrokes_count: { type: Number, default: 0 },
    mouseclicks_count: { type: Number, default: 0 },
    mousemovement_count: { type: Number, default: 0 },
    created_at: { type: Date, default: null },
    updated_at: { type: Date, default: null },
    createdOn: { type: Date, default: new Date() }
});

const empActivityModel = mongoose.model('employee_activities', empActivitiesSchema)
module.exports = empActivityModel;