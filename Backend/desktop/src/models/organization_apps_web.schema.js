const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orgAppWebSchema = new Schema({
    // id: { type: Number, required: true, unique: true },
    name: { type: String },
    type: { type: Number, enum: [0, 1, 2], default: null },
    organization_id: { type: Number },
    department_id:  { type: Number },
    status: { type: Number, enum: [0, 1, 2], default: 0 },
    org_apps_web_group_id: { type: Number, default: null },
    created_at: { type: Date, default: null },
    updated_at: { type: Date, default: null },
    createdOn: { type: Date, default: new Date() }
});

const orgAppWeb = mongoose.model('organization_apps_web', orgAppWebSchema)
module.exports = orgAppWeb;