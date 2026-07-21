const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrgDeptAppWebModel = require('./organizaton_department_apps_web.schema');

const OrgAppWebSchema = new Schema({
    name: { type: String, lowercase: true, trim: true, required: true },
    type: { type: Number, enum: [0, 1, 2], default: 0 },  // 0-undefined, 1-app, 2-website
    organization_id: { type: Number, required: true },
    org_apps_web_group_id: { type: Number, default: null },
    is_new: { type: Boolean, required: true, default: true },
    prediction: { type: String, default: null },
    category_ids: [{ type: mongoose.Types.ObjectId, ref: 'organization_categories', default: null }],
}, { timestamps: true });

OrgAppWebSchema.index({ organization_id: 1, name: 1, type: 1 }, { unique: true });
OrgAppWebSchema.index({ organization_id: 1, name: 1 });
OrgAppWebSchema.index({ organization_id: 1, type: 1, name: 'text' });

// OrgAppWebSchema.post('save', async function (doc) {
//     const orgDeptAppWeb = await OrgDeptAppWebModel.findOne({ application_id: doc._id });

//     if (!orgDeptAppWeb) {
//         new OrgDeptAppWebModel({
//             application_id: doc._id,
//             type: 1, // 1-Global, 2-Custom
//             status: 0,  // 0-Neutral, 1-productive, 2-non productive
//         }).save((err, data) => { })
//     }
// });

const OrgAppWebModel = mongoose.model('organization_apps_webs', OrgAppWebSchema);
module.exports = OrgAppWebModel;