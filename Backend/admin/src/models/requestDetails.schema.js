// requestDetails Collection Schema

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema
const requestDetailsSchema = new Schema({
    organization_id: { type: Number, required: true },
    employee_id: { type: Number, required: true }, // ref from employees table
    type: { type: Number, required: true }, // 1-basic details, 2-bank details, 3-compliance details, 4-qualification details, 5-family details
    module_name: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    status: { type: Number, required: true }, // 1-pending, 2-accepted, 3-rejected
    updated_date: { type: Date, default: null },
    updated_by: { type: Number, default: null }, // ref from users table

}, { timestamps: true });

// indexes
requestDetailsSchema.index({ organization_id: 1, employee_id: 1 });
requestDetailsSchema.index({ organization_id: 1, updated_by: 1 });

// exports
module.exports.RequestDetailsModel = mongoose.model('employee_update_request', requestDetailsSchema);