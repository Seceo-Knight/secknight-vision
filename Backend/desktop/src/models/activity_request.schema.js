const mongoose = require('mongoose');
const Schema = mongoose.Schema;
/**
 * Activity modification request model
 */
const ActivityRequest = new Schema({
    employee_id: { type: Number, required: true },
    attendance_id: { type: Number, default: null },
    organization_id: { type: Number, required: true },
    approved_by: { type: Number, default: null },//user_id by user table
    date: { type: String, required: true },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },
    status: { type: Number, default: 0 }, // 0-PENDING ,1-APPROVED, 2-DECLIENED
    reason: { type: String, required: true },
    type: { type: Number, required: true }, // 1-IDLE-HOURS-CLAIM, 2-OFFLINE-HOURS-CLAIM
    activities: [{
        activity_id: { type: Schema.Types.ObjectId, ref: 'employee_activities' },
        total_duration: { type: Number, default: null },//old total duration to show history
        active_seconds: { type: Number, default: null }//old active duration to show history
    }],
    offline_time: { type: Number, default: 0 }
}, { timestamps: true });

ActivityRequest.index({ employee_id: 1 });
ActivityRequest.index({ organization_id: 1, employee_id: 1 });
ActivityRequest.index({ employee_id: 1, date: 1 });
// ActivityRequest.index({ employee_id: 1, date: 1, start_time: 1, end_time: 1 }, { unique: true });

const ActivityRequestModel = mongoose.model('activity_request', ActivityRequest)

module.exports = ActivityRequestModel;
