const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSystemLogsSchema = new Schema({
    employee_id: { type: Number },
    organization_id: { type: Number },
    log_data: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

EmployeeSystemLogsSchema.index({ employee_id: 1 });
EmployeeSystemLogsSchema.index({ organization_id: 1 });
EmployeeSystemLogsSchema.index({ createdAt: 1 });

const EmployeeSystemLogsModel = mongoose.model('employee_system_logs', EmployeeSystemLogsSchema);
module.exports = EmployeeSystemLogsModel;

