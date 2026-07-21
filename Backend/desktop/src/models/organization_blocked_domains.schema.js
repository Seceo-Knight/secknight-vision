const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ordBlockedDomainsSchema = new Schema({
    id: { type: Number, required: true, unique: true },
    block_type: { type: String, enum: ['U', 'D'], default: 'U' },
    userOrDeptId: { type: [Number], default: [] },
    days: { type: [Number], default: [1, 2, 3, 4, 5, 6, 7] },
    category_ids: { type: [Schema.Types.ObjectId], default: null },
    domain_ids: { type: [Schema.Types.ObjectId], default: null },
    status: { type: Number, enum: [0, 1, 2], default: 1 },
    created_at: { type: Date, default: null },
    updated_at: { type: Date, default: null },
    createdOn: { type: Date, default: new Date() }
});

const orgBlockedDomains = mongoose.model('organization_blocked_domains', ordBlockedDomainsSchema)
module.exports = orgBlockedDomains;