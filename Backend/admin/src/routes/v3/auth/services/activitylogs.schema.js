const mongoose = require('mongoose');
const activityLogsSchema = new mongoose.Schema({
    employeeId: { type: Number, required: true },
    organization: { type: Number, trim: true, required: true },
    type:{type:String},
    logIn: { type: Date},
    logOut: { type: Date },
}, { timestamps: true })
const activitySchema= mongoose.model('activityLoginSchema', activityLogsSchema);
module.exports = activitySchema;
activityLogsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2764800  });
activityLogsSchema.index({ employeeId: 1 ,organization:1});
