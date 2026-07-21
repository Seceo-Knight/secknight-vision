const mongoose = require('mongoose');
const { Schema } = mongoose;
const MobileGeoLocationSchema = new Schema({
    employee_id: { type: Number, required: true },
    organization_id: { type: Number, required: true },
    date: { type: String, required: true },
    yyyymmdd: { type: Number, required: true },
    geoLogs: [{
        time: { type: Date, default: null },
        latitude: { type: Number, default: null },
        longitude: { type: Number, default: null },
        city: { type: String, default: null },
        address: { type: String, default: null },
    }]
}, { timestamps: true });
MobileGeoLocationSchema.index({ employee_id: 1 });
MobileGeoLocationSchema.index({ organization_id: 1, employee_id: 1 });
MobileGeoLocationSchema.index({ employee_id: 1, organization_id: 1, yyyymmdd: 1 }, { unique: true });
const MobileGeoLocationModel = mongoose.model('mobilegeolocationlogs', MobileGeoLocationSchema)
module.exports = MobileGeoLocationModel;