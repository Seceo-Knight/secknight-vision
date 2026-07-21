const mongoose = require('mongoose');
const { string } = require('@hapi/joi');
const Schema = mongoose.Schema;

const EmailActivity = new Schema({
    organization_id: { type: Number, required: true },
    employee_id: { type: Number, required: true },
    department_id: { type: Number, required: true },
    location_id: { type: Number, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    cc: { type: String, default: '' },
    bcc: { type: String, default: '' },
    attachments: [{
        name: { type: String, default: '' },
        link: { type: String, default: '' },
        mail_id: { type: String, default: '' },
        attachment_id: { type: String, default: '' },
        file_name: { type: String, default: '' },
        file_path: { type: String, default: '' },
        file_size: { type: String, default: '' },
        file_content: { type: String, default: '' },
    }],
    subject: { type: String, default: null },
    body: { type: String, default: null },
    mail_time: { type: Date, required: true },
    date: { type: String, required: true },//format yyyy-mm-dd
    client_type: { type: String, required: true },// gmail, outlook,yahoo mail etc...
    type: { type: Number, required: true }, //1-Incoomig 2-Outgoing

}, { timestamps: true });
EmailActivity.index({ attendance_id: 1 });
EmailActivity.index({ organization_id: 1 });
EmailActivity.index({ department_id: 1, organization_id: 1 });
EmailActivity.index({ location_id: 1, organization_id: 1 });
EmailActivity.index({ employee_id: 1, organization_id: 1 });
EmailActivity.index({ client_type: 1, organization_id: 1 });
EmailActivity.index({ date: 1 });

const EmpActivityModel = mongoose.model('email_activity', EmailActivity)

module.exports = EmpActivityModel;
// EmpActivityModel.insertMany([
//     {
//         attendance_id: 1,
//         mail_time: new Date(),
//         date: '2020-07-20',
//         employee_id: 43,
//         computer: 'glb-123',
//         from: 'abc@gmail.com',
//         to: 'xyz@gmail.com',
//         subject: 'subject',
//         body: 'body',
//         organization_id: 1,
//         client_type: 'out',
//         department_id: 23,
//         type: 2,
//         location_id: 3,

//     },
//     {
//         attendance_id: 1,
//         mail_time: new Date(),
//         date: '2020-07-20',
//         employee_id: 43,
//         computer: 'glb-123',
//         from: 'abc@gmail.com',
//         to: 'xyz@gmail.com',
//         subject: 'subject',
//         body: 'body',
//         organization_id: 1,
//         client_type: 'out',
//         department_id: 23,
//         type: 1,
//         location_id: 3,

//     },
//     {
//         attendance_id: 1,
//         mail_time: new Date(),
//         date: '2020-07-19',
//         employee_id: 43,
//         computer: 'glb-123',
//         from: 'abc@gmail.com',
//         to: 'xyz@gmail.com',
//         subject: 'subject',
//         body: 'body',
//         organization_id: 1,
//         client_type: 'out',
//         department_id: 23,
//         type: 2,
//         location_id: 3,

//     },
//     {
//         attendance_id: 2,
//         mail_time: new Date(),
//         date: '2020-07-20',
//         employee_id: 44,
//         computer: 'glb-124',
//         from: 'abc@gmail.com',
//         to: 'xyz@gmail.com',
//         subject: 'subject',
//         body: 'body',
//         organization_id: 4,
//         client_type: 'outlook',
//         department_id: 1,
//         location_id: 1,
//         type: 2
//     }])