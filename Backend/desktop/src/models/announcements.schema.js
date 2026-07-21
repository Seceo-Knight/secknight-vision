const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const announcemntsSchema = new Schema({
    organization_id: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    type: { type: Number, default: 1 },//1-all, 0-custom
    users: { type: [Number], default: [] },//ref from users table
    delevered_users: {
        type: [{
            user_id: { type: Number, required: true },
            delivered_at: { type: Date, default: new Date() }
        }], default: []
    },//ref from users table
    is_active: { type: Number, default: 1 },//1-active, 0-closed
    created_by: { type: Number, required: true },//ref from users table
    date: { type: String, required: true },
    end_date: { type: String, default: null }
}, { timestamps: true });

announcemntsSchema.index({ organization_id: 1 });
announcemntsSchema.index({ created_by: 1 });
announcemntsSchema.index({ organization_id: 1, delevered_users: 1 });

module.exports.AnnouncemntsModel = mongoose.model('announcemnts', announcemntsSchema);