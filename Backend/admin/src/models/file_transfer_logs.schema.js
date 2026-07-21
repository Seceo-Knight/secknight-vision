const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FileTransferLogsSchema = new Schema(
    {
        employee_id: { type: Number, required: true },
        organization_id: { type: Number, required: true },
        date: { type: String, required: true },
        date_time: { type: Date, required: true },
        action: { type: String, required: true },
        source: { type: String, required: true },
        folder: { type: String, default: null },
        screenshot: { type: String, default: null },
        file_name: { type: String, default: null },
        extension: { type: String, default: null },
        application: { type: String, default: null },
        description: { type: String, default: null },
    },
    {
        timestamps: true,
        autoIndex: true,
    },
);
FileTransferLogsSchema.index(
    { organization_id: 1, employee_id: 1, date: 1 },
    { background: true },
);
FileTransferLogsSchema.index(
    { organization_id: 1, date: 1 },
    { background: true },
);

FileTransferLogsSchema.index({ employee_id: 1, date: 1 }, { background: true });

module.exports = mongoose.model('file_transfer_logs', FileTransferLogsSchema);
