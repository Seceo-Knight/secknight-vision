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
        application_id: { type: mongoose.Types.ObjectId, required: true },
        tasks: [{
            task_id: { type: Number, required: true },
            pro: { type: Number, default: 0 },
            non: { type: Number, default: 0 },
            neu: { type: Number, default: 0 },
            total: { type: Number, default: 0 }
        }],
        pro: { type: Number, default: 0 },
        non: { type: Number, default: 0 },
        neu: { type: Number, default: 0 },
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
        applications: [{
            application_id: { type: mongoose.Types.ObjectId, required: true },
            pro: { type: Number, default: 0 },
            non: { type: Number, default: 0 },
            neu: { type: Number, default: 0 },
            total: { type: Number, default: 0 },
            application_type: { type: Number, enum: [0, 1, 2], default: 0 } // 0-undefined, 1-app, 2-website
        }],
        pro: { type: Number, default: 0 },
        non: { type: Number, default: 0 },
        neu: { type: Number, default: 0 },
        total: { type: Number, default: 0 }
    }],
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    day: { type: Number, required: true },
    yyyymmdd: { type: Number, required: true },  //  Example: 20200515
    date: { type: String, required: true },
}, { timestamps: true, versionKey: false });

EmpProductivityReportSchema.index({ employee_id: 1 });
EmpProductivityReportSchema.index({ department_id: 1 });
EmpProductivityReportSchema.index({ location_id: 1 });
EmpProductivityReportSchema.index({ organization_id: 1 });
EmpProductivityReportSchema.index({ organization_id: 1, yyyymmdd: 1 });
EmpProductivityReportSchema.index({ employee_id: 1, yyyymmdd: 1 }, { unique: true });

const EmpProductivityReportModel = mongoose.model('employee_productivity_reports', EmpProductivityReportSchema);

module.exports = EmpProductivityReportModel;

// new EmpProductivityReportModel({
//     employee_id: 22,
//     organization_id: 7,
//     department_id: 16,
//     location_id: 12,
//     productive_duration: 100,
//     non_productive_duration: 200,
//     neutral_duration: 300,
//     idle_duration: 400,
//     break_duration: 500,
//     applications: [
//         {
//             application_id: "5eb10608e99acb2064a36308",
//             tasks: [ { task_id: 1, pro: 100, non: 0, neu: 0 }, { task_id: 2, pro: 100, non: 0, neu: 0 } ],
//             pro: 200,
//             non: 0,
//             neu: 0
//         },
//         {
//             application_id: "5eb10608e99acb2064a36309",
//             tasks: [ { task_id: 1, pro: 100, non: 0, neu: 0 }, { task_id: 2, pro: 100, non: 0, neu: 0 } ],
//             pro: 200,
//             non: 0,
//             neu: 0
//         }
//     ],
//     tasks: [
//         {
//             task_id: 1,
//             applications: [{ application_id: "5eb10608e99acb2064a36308", pro: 100, non: 0, neu: 0 }, { application_id: "5eb10608e99acb2064a36309", pro: 100, non: 0, neu: 0 }],
//             pro: 200,
//             non: 0,
//             neu: 0
//         },
//         {
//             task_id: 2,
//             applications: [{ application_id: "5eb10608e99acb2064a36308", pro: 100, non: 0, neu: 0 }, { application_id: "5eb10608e99acb2064a36309", pro: 100, non: 0, neu: 0 }],
//             pro: 200,
//             non: 0,
//             neu: 0
//         }
//     ],
//     year: 2020,
//     month: 5,
//     day: 14,
//     yyyymmdd: 20200514,
//     date: "2020-05-14",
// }).save((err, data) => {
//     console.log(err)
//     console.log(data)
// })
