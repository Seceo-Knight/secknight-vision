const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GeoLocationChangeSchema = new Schema({
    employee_id: { type: Number, required: true },
    organization_id: { type: Number, required: true },
    time: { type: Number, required: true},
    latitude: { type: String, required: true},
    longitude: { type: String, required: true},
}, { timestamps: true });

GeoLocationChangeSchema.index({ employee_id: 1 });
GeoLocationChangeSchema.index({ organization_id: 1, employee_id: 1 });

GeoLocationChangeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 16000000 });

const GeoLocationChangeLogModel = mongoose.model('geo_location_change_log', GeoLocationChangeSchema);
module.exports = GeoLocationChangeLogModel;