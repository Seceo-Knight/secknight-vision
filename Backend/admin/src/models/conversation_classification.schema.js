const mongoose = require('mongoose');
const { truncate } = require('lodash');
const Schema = mongoose.Schema;

const ConversationClassification = new Schema({
    employee_id: { type: Number, required: true },
    application_id: { type: mongoose.Types.ObjectId, required: true },
    prediction: { type: Number, default: 0 },
    date: { type: String, required: true },//format yyyy-mm-dd
    offensive_words: { type: String, default: null },
    organization_id: { type: Number, required: true },
    sentimentalAnalysis: {
        negative_sentences:{ type:Array,required:true, default:null },
        positive_sentences:{ type:Array,required:true, default:null }
    },
}, { timestamps: true });
ConversationClassification.index({ employee_id: 1 });
ConversationClassification.index({ date: 1 });
ConversationClassification.index({ application_id: 1 });
ConversationClassification.index({ organization_id: 1 });

const ConversationClassificationModel = mongoose.model('conversation_classification', ConversationClassification)

module.exports = ConversationClassificationModel;


// const model = require('../../../models/conversation_classification.schema')

// ConversationClassificationModel.insertMany([{ application_id: '5ec68c93366721bdda1d4262', employee_id: 1, prediction: 0.1234, date: "2020-08-13", organization_id: 1, offensive_words: 'qwewer ,asads' },
// { application_id: '5ec68c93366721bdda1d4262', employee_id: 1, prediction: 0.1234, date: "2020-08-13", organization_id: 1, offensive_words: 'qwewer ,asads' },
// { application_id: '5ec68c93366721bdda1d4262', employee_id: 1, prediction: 0.1234, date: "2020-08-13", organization_id: 1, offensive_words: 'qwewer ,asads' },
// ]);
// console.log(ConversationClassificationModel, '---------------------------')