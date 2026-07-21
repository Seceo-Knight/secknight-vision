const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmpKeyStrokes = new Schema(
    {
        attendance_id: { type: Number, default: null },
        application_id: { type: Number, default: null },
        task_id: { type: Number, default: null },
        project_id: { type: Number, default: null },
        activity_id: { type: Number, default: null },
        keystrokes: { type: String, default: null },
    },
    {timestamps: true}
);

const EmpKeyStrokesModel = mongoose.model('employee_keystrokes', EmpKeyStrokes);
module.exports = EmpKeyStrokesModel;