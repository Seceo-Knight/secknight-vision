const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ReportActivityLogSchema = new Schema(
    {
		type: { 
            type: String, 
            default: 'null' 
        },
		user_id: { 
            type: Number, 
            required: true,
        },
        organization_id :{
            type: Number, 
            required: true,
        },
        stage: {
            type: String,
            default: 'new'
        },
        file_path: {
            type: String,
            default: null
        },
        filename: {
            type: String,
            default: null
        },
        download_link: {
            type: String,
            default: null
        },
        no_of_rows: {
            type: Number,
            default: 0
        },
        is_deleted: {
            type: Boolean,
            default: false
        },
        is_active: {
            type: Boolean,
            default: true
        },
        is_downloaded: {
            type: Boolean,
            default: false
        },
        file_size: {
            type: String,
            default: 0,
            required: false
        }
	},
	{ timestamps: true },
);

module.exports = mongoose.model('report_activity_log', ReportActivityLogSchema);
