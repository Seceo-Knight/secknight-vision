const { Schema, Types, model } = require('mongoose');
const EventEmitter = require('../modules/alerts/Alerts');
// const jobs = require('../jobs');
const AlertJobs = require('../modules/alerts/Alerts');

const EmpActivitiesSchema = new Schema({
    // id: { type: Number, required: true, unique: true },
    attendance_id: { type: Number, default: null, index: true },
    employee_id: { type: Number, default: null },
    organization_id: { type: Number, default: null },
    application_id: { type: Types.ObjectId, required: true },
    domain_id: { type: Types.ObjectId, default: null },
    url: { type: String, default: null },
    title: { type: String, default: null },
    task_id: { type: Number, default: null },
    project_id: { type: Number, default: null },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },
    total_duration: { type: Number, default: 0 },
    active_seconds: { type: Number, default: 0 },
    keystrokes_count: { type: Number, default: 0 },
    mouseclicks_count: { type: Number, default: 0 },
    mousemovement_count: { type: Number, default: 0 },
    keystrokes: { type: String, default: '' },
    createdOn: { type: Date, default: new Date() },
    idleData: [{ start_time: { type: Date, default: null }, end_time: { type: Date, default: null } }],
    activeData: [{ start_time: { type: Date, default: null }, end_time: { type: Date, default: null } }],
    prediction: { type: String, default: null },
    computer_details: { type: String, default: null },
}, { timestamps: true });

EmpActivitiesSchema.index({ attendance_id: 1, domain_id: 1, application_id: 1, employee_id: 1 });

// const addAlertJob = (doc) => {
//     return jobs.queue.enqueue('activityCreatedJob', [doc.attendance_id, doc._id]);
// };
// EmpActivitiesSchema.post('save', addAlertJob);
// EmpActivitiesSchema.post('insertMany', (docs) => Promise.all(docs.map(addAlertJob)));

// EmpActivitiesSchema.post('save', (doc) => AlertJobs.alertRequestToanotherService([doc]));
// EmpActivitiesSchema.post('insertMany', (docs) => AlertJobs.alertRequestToanotherService(docs));
EmpActivitiesSchema.post('save', (doc) => EventEmitter.emit('activity', [doc]));
EmpActivitiesSchema.post('insertMany', (docs) => EventEmitter.emit('activity', docs));

const EmployeeActivityModel = model('employee_activities', EmpActivitiesSchema);
module.exports.EmployeeActivityModel = EmployeeActivityModel;

// const toBeAddedData = {
//         "attendance_id" : 20158,
//         "application_id" : "5ec68dd2366721bdda1d4317",
//         "domain_id" : null,
//         "url" : null,
//         "task_id" : null,
//         "project_id" : null,
//         "start_time" : "2020-09-14T01:05:40.000Z",
//         "end_time" : "2020-09-14T01:05:50.000Z",
//         "total_duration" : 397,
//         "active_seconds" : 300,
//         "keystrokes_count" : 32,
//         "mouseclicks_count" : 0,
//         "mousemovement_count" : 0,
//         "keystrokes" : "hsfbgakhbgkadgkafbhvbs skd ASKal",
//         "created_at" : "2020-09-14T05:57:35.000Z",
//         "updated_at" : "2020-09-14T05:57:35.000Z",
//         "createdOn" : "2020-09-14T20:34:34.143Z",
//     };
// console.log('EmployeeActivityModel.insertMany!!!!!');
// EmployeeActivityModel.insertMany(toBeAddedData);


let data = [
    {
        "attendance_id": 3559,
        "application_id": "5f9d8f3fbf8917ebf5b8996c",
        "domain_id": null,
        "url": null,
        "task_id": null,
        "project_id": null,
        "start_time": "2020-11-07T04:45:20.651Z",
        "end_time": "2020-11-07T04:45:40.651Z",
        "total_duration": 20,
        "active_seconds": 20,
        "keystrokes_count": 32,
        "mouseclicks_count": 0,
        "mousemovement_count": 0,
        "keystrokes": "hsfbgakhbgkadgkafbhvbs skd ASKal",
        "id": 2
    }
]


// let toBeAddedData = [];
// for (let index = 0; index < 39; index++) {
//     toBeAddedData.push(data[4])
// }
// EmployeeActivityModel.insertMany(data).then((res) => { console.log('--------', res) }).catch(console.log('====='));
const x = async () => {

    try {
        const data = await EmployeeActivityModel.findOne({ "attendance_id": 3559 }).sort({ _id: -1 });

        data.total_duration = 210;
        data.active_seconds = 10;
        await data.save();
        console.log('-------',)
    } catch (err) {
        console.log('----------', err);
    }
}

// x();