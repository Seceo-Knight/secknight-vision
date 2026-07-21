const { activityCreatedJob } = require('./activityCreatedJob');
const { sendAlertJob } = require('./sendAlertJob');
const { DWTLessJob } = require('./DWTLessJob');
const { ruleLifetimeEventJob } = require('./ruleLifetimeEventJob');
const { SEEJob } = require('./SEEJob');
const { offlineJob } = require('./offlineJob');

module.exports = {
    activityCreatedJob: activityCreatedJob,
    sendAlertJob: sendAlertJob,
    DWTLessJob: DWTLessJob,
    ruleLifetimeEventJob: ruleLifetimeEventJob,
    SEEJob: SEEJob,
    offlineJob: offlineJob
};