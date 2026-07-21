const mongoose = require('mongoose');
const Schema = mongoose.Schema;


var SchemaTypes = mongoose.Schema.Types;
require('mongoose-double')(mongoose);
const EmpProductivityReportSchema = new Schema({
    employee_id: { type: Number, required: true },
    department_id: { type: Number, required: true },
    location_id: { type: Number, required: true },
    organization_id: { type: Number, required: true },
    logged_duration: { type: Number, default: 0, required: true },
    productive_duration: { type: Number, required: true },
    non_productive_duration: { type: Number, required: true },
    neutral_duration: { type: Number, required: true },
    idle_duration: { type: Number, required: true },
    break_duration: { type: Number, required: true },
    risk_percentage: { type: Number, default: 0 },
    applications: [{
        application_id: { type: mongoose.Types.ObjectId, ref: 'organization_apps_webs', required: true },
        tasks: [{
            task_id: { type: Number, required: true },
            pro: { type: Number, default: 0 },
            non: { type: Number, default: 0 },
            neu: { type: Number, default: 0 },
            idle: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        }],
        pro: { type: Number, default: 0 },
        non: { type: Number, default: 0 },
        neu: { type: Number, default: 0 },
        idle: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        application_type: { type: Number, enum: [0, 1, 2], default: 0 } // 0-undefined, 1-app, 2-website
    }],
    sentimentalAnalysis: {
        positive: { type: SchemaTypes.Double, default: 0 },
        negative: { type: SchemaTypes.Double, default: 0 },
        neutral: { type: SchemaTypes.Double, default: 100 },
    },
    tasks: [{
        task_id: { type: Number, required: true },
        project_id: { type: Number, default: null },
        applications: [{
            application_id: { type: mongoose.Types.ObjectId, ref: 'organization_apps_webs', required: true },
            pro: { type: Number, default: 0 },
            non: { type: Number, default: 0 },
            neu: { type: Number, default: 0 },
            idle: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            application_type: { type: Number, enum: [0, 1, 2], default: 0 } // 0-undefined, 1-app, 2-website
        }],
        pro: { type: Number, default: 0 },
        non: { type: Number, default: 0 },
        neu: { type: Number, default: 0 },
        idle: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }],
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    yyyymmdd: { type: Number, required: true },  //  Example: 20200515
    date: { type: String, required: true },
    offline_time: { type: Number, default: 0 },
}, { timestamps: true, versionKey: false });

EmpProductivityReportSchema.index({ employee_id: 1 });
EmpProductivityReportSchema.index({ department_id: 1 });
EmpProductivityReportSchema.index({ location_id: 1 });
EmpProductivityReportSchema.index({ organization_id: 1 });
EmpProductivityReportSchema.index({ organization_id: 1, yyyymmdd: 1 });
EmpProductivityReportSchema.index({ employee_id: 1, yyyymmdd: 1 }, { unique: true });

const EmpProductivityReportModel = mongoose.model('employee_productivity_reports', EmpProductivityReportSchema);

module.exports = EmpProductivityReportModel;

