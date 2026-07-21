const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSystemLogsSchema = new Schema({
    employee_id: { type: Number },
    organization_id: { type: Number },
    log_data: { type: Schema.Types.Mixed, required: true },
    type: { type: Number, default: 0 }, // 0 for system logs, 1 for email monitoring logs    
    start_time: { type: Date },
    end_time: { type: Date },
}, { timestamps: true });

EmployeeSystemLogsSchema.index({ employee_id: 1 });
EmployeeSystemLogsSchema.index({ organization_id: 1 });
EmployeeSystemLogsSchema.index({ createdAt: 1 });

const EmployeeEmailMonitoringLogsModel = mongoose.model('employee_email_monitoring_logs', EmployeeSystemLogsSchema);
module.exports = EmployeeEmailMonitoringLogsModel;