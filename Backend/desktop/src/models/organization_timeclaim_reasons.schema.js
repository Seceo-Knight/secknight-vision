const { Schema, Types, model } = require('mongoose');
const OrganizationReasonSchema = new Schema({
    organization_id: { type: Number, required: true, index: true },
    reasons: [{
            name: { type: String, required: true },
            type: { type: Number, required: true } // 1- Idle_claims, 2- Offline_claims, 3- Break_claims
        }],
}, { timestamps: true });
OrganizationReasonSchema.index({ attendance_id: 1, domain_id: 1, application_id: 1 });
const OrganizationReasonModel = model('organization_reason_timeclaim', OrganizationReasonSchema);
module.exports.OrganizationReasonModel = OrganizationReasonModel;