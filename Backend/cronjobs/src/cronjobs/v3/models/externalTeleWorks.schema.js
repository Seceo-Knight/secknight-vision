const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExternalTeleWorksData = new Schema(
    {
        organization_id: { type: Number, index: true },
        employeesDetails: [{ 
            IdNumber: {type : String}, 
            EstLaborOfficeId: {type : String},
            EstSequenceNumber: {type :String},
            email: {type :String},
            manager_email: {type :String},
            ActivityLevel: {type : String},
            TotalWorkTime: {type : String},
            AssignedTasks: {type : Number},
            CompletedTasks: {type : Number},
            LoginCount: {type : Number},
            LogoutCount: {type : Number},
            api_response: {type : String},
            type: {type : String},
        }],
        date: { type: String },
        successEmployeeIds:[{type: Number}],
        api_response_message: { type: String },
    },
    { timestamps: true }
);

ExternalTeleWorksData.index({ organization_id: 1 });
ExternalTeleWorksData.index({ date: 1 });

const ExternalTeleWorksDataModel = mongoose.model('external_teleworks_data', ExternalTeleWorksData);

module.exports = ExternalTeleWorksDataModel;