const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Activity modification request model
 */
const BreakRequest = new Schema({
    employee_id: { type: Number, required: true },
    attendance_id: { type: Number, default: null },
    organization_id: { type: Number, required: true },
    approved_by: { type: Number, default: null },//user_id by user table
    date: { type: String, required: true },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },
    status: { type: Number, default: 0 }, // 0-PENDING ,1-APPROVED, 2-DECLIENED
    reason: { type: String, required: true },
    offline_time: { type: Number, default: 0 }
}, { timestamps: true });

BreakRequest.index({ employee_id: 1 });
BreakRequest.index({ organization_id: 1, employee_id: 1 });
BreakRequest.index({ employee_id: 1, date: 1 });
// BreakRequestModel.index({ employee_id: 1, date: 1, start_time: 1, end_time: 1 }, { unique: true });

const BreakRequestModel = mongoose.model('break_request', BreakRequest)

module.exports = BreakRequestModel;
