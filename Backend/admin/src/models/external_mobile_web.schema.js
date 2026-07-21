// external_mobile_web.schema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExternalMobileWebUsage = new Schema(
    {
        organization_id: { type: Number, index: true },
        employee_id: { type: Number, },
        link: { type: String, },
        start_time: { type: "String"},
        end_time: { type: "String"},
        date: { type: String,}
    },
    { timestamps: true }
);

ExternalMobileWebUsage.index({ organization_id: 1 });
ExternalMobileWebUsage.index({ organization_id: 1, date: 1 });

const ExternalMobileWebUsageModel = mongoose.model('external_mobile_web_usage', ExternalMobileWebUsage);

module.exports = ExternalMobileWebUsageModel;