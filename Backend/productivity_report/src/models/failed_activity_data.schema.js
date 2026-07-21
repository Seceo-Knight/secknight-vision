const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const crypted = require('./crypted');

// actual app usage data
// if application then url will be empty or null
// title can be same
// when the app starts, ex 10:15:35--> 35 will be start
// when the app stops, ex 10:15:47--> 47 will be end
// NOTE: next app starts will be end of current app, 10: 15: 47-- > 47 will be start of next app detail entry
const appUsageSchema = new Schema({
    ageOfData: { type: Number, required: true, default: -1 },
    app: { type: String, required: true, default: null },
    start: { type: Number, required: true, default: -1 },
    end: { type: Number, required: true, default: -1 },
    title: { type: String, default: '' },
    url: { type: String, default: 'null', ...crypted },
    keystrokes: { type: String, default: '', ...crypted },
}, { toJSON: { getters: true }, toObject: { getters: true } });

// mouse clicks,fake activities, keystrokes and mouse movements within specified time period
// precisely for every seconds
// if some activity is their then count of that activity (like mouseclick,keystrokes count)
// else 0 to that very second
const activityPerSecondSchema = new Schema({
    buttonClicks: { type: String, required: true, ...crypted },
    fakeActivities: { type: [Number], required: true },
    keystrokes: { type: String, required: true, ...crypted },
    mouseMovements: { type: String, required: true, ...crypted }
}, { toJSON: { getters: true }, toObject: { getters: true } });

const FailedActivityData = new Schema({
    attendanceDate: { type: Number, required: true },
    systemTimeUtcDayOneEnd: { type: String, required: true },
    systemTimeUtcDayOneEnd: { type: String, required: true },
    organization_id: { type: Number, required: true },
    project_id: { type: Number, required: true },
    task_id: { type: Number, required: true },
    employee_id: { type: Number, required: true },
    break_duration: { type: Number, required: true },
    appUsage: [appUsageSchema],
    activityPerSecond: activityPerSecondSchema,
    systemTimeUtc: { type: String, required: true },
    email: { type: String, required: true },
    timezone: { type: String, required: true },
    timesheetIdleTime: { type: Number, required: true },
    productivityCategory: { type: Number, required: true },
}, { timestamps: true });

const FailedActivityDataModel = mongoose.model('FailedActivityData', FailedActivityData)

module.exports = FailedActivityDataModel;