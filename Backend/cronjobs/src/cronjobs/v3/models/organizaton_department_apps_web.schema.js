const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrgDeptAppWebSchema = new Schema({
    application_id: { type: mongoose.Types.ObjectId, ref: 'organization_apps_webs', index: true },
    department_id: { type: Number, default: null },
    type: { type: Number, required: true },  // 1-Global, 2-Custom
    status: { type: Number, enum: [0, 1, 2], default: 0 },  // 0-Neutral, 1-productive, 2-non productive
    created_by: { type: Number, default: null },
    updated_by: { type: Number, default: null }
}, {timestamps: true});

const OrgDeptAppWebModel = mongoose.model('organization_department_apps_webs', OrgDeptAppWebSchema);

module.exports = OrgDeptAppWebModel;

// new OrgDeptAppWebModel({
//     application_id: "5ec68ddc366721bdda1d4320",
//     type: 1,  // 1-Global, 2-Custom
//     status: 0,  // 0-Neutral, 1-productive, 2-non productive
// }).save((err, data) => {
//     console.log(err)
//     console.log(data)
// })