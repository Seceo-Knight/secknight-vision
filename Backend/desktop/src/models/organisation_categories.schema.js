const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orgCatSchema = new Schema({
    id: { type: Number, required: true, unique: true },
    organization_id: { type: Number },
    parent_id: { type: Schema.Types.ObjectId, default: null },
    name: { type: String },
    status: { type: Number, enum: [0, 1, 2], default: 1 },
    created_at: { type: Date, default: null },
    updated_at: { type: Date, default: null },
    createdOn: { type: Date, default: new Date() }
});

const orgCat = mongoose.model('organization_categories', orgCatSchema)
module.exports = orgCat;