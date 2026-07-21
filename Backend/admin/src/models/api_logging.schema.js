const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApiLoggingSchema = new Schema({
    organization_id: { type: Number, required: true },
    method: { type: String, required: true },
    endpoint: { type: String, required: true },
    status_code: { type: Number, required: true },
    request_body: { type: Schema.Types.Mixed, default: null },
    response_body: { type: Schema.Types.Mixed, default: null },
    user_id: { type: Number, default: null }, // user_id from user table
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });
ApiLoggingSchema.index({ organization_id: 1, endpoint: 1, timestamp: -1 });
const ApiLoggingModel = mongoose.model('api_logging', ApiLoggingSchema);

module.exports = ApiLoggingModel;
