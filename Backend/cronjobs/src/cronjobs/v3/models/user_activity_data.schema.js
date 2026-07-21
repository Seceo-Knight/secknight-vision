const moment = require('moment');
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

// from where teh api is called and the time diffrence between api called (end - start)
// default duration of api call is set in .env file in seconds
const modeSchema = new Schema({
    name: { type: String, required: true, default: 'computer' },
    start: { type: Number, required: true, default: 0 },
    end: { type: Number, required: true, default: 0 }
}, { toJSON: { getters: true }, toObject: { getters: true } });


const UserActivityDataSchema = new Schema({
    // taken from decoded token data
    userId: { type: Number, required: true },
    userEmail: { type: String, required: true, ...crypted },
    adminId: { type: Number, required: true },

    // dataId - sent by desktop app (consist date + time)
    dataId: { type: String, required: true },
    // systemTimeUtc - if system's clock is wrongly configured- to comapre with utc time
    systemTimeUtc: { type: String, required: true },
    // date scrapped from dataId
    date: { type: String, required: true },
    // time scrapped from dataId
    time: { type: String, required: true },

    // server/mongo time when the api is called, converted into utc for calculation/filteration
    timestampInUtc: { type: Number, default: moment().utc().format('X'), required: true },
    // server/mongo time when the api is called
    timestampServer: { type: Number, default: moment().format('X'), required: true },
    // time when the api is called
    timestampActual: { type: Number, default: moment().format('X'), required: true },

    projectId: { type: Number, required: true, default: 0 },
    taskId: { type: Number, required: true, default: 0 },
    breakInSeconds: { type: Number, required: true, default: 0 },

    taskNote: { type: String, default: '' },

    appVersion: { type: String, default: '' },

    // total number of mouse clicks,fake activities, keystrokes and mouse movements within specified time period
    clicksCount: { type: Number, required: true, default: 0 },
    fakeActivitiesCount: { type: Number, required: true, default: 0 },
    keysCount: { type: Number, required: true, default: 0 },
    movementsCount: { type: Number, required: true, default: 0 },

    activityPerSecond: activityPerSecondSchema,

    mode: modeSchema,
    appUsage: [appUsageSchema],

    status: { type: Number }

}, { timestamps: true, autoIndex: true, toJSON: { getters: true }, toObject: { getters: true } });

const UserActivityDataModel = mongoose.model('useractivitydatas', UserActivityDataSchema);
module.exports = UserActivityDataModel;


// (async () => {
//     const a = await UserActivityDataModel.findOne({ _id: "5f3a67b89cc6191693e43469" }).sort({ _id: -1 });
//     console.log('-------------', a);

// })();