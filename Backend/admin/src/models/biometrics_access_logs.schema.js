const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BiometricsAccessLogSchema = new Schema({
    organization_id: { type: Number, required: true },
    employee_id: { type: Number, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, },
    yyyymmdd: { type: Number, required: true },
    department_id: { type: Number, required: true },
}, { timestamps: true });
BiometricsAccessLogSchema.index({ organization_id: 1, employee_id: 1 });

const BiometricAccessLogModel = mongoose.model('biometrics_access_logs', BiometricsAccessLogSchema)

module.exports = BiometricAccessLogModel;