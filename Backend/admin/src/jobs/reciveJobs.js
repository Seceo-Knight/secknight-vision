const jobs = require('./index');
const { logger: Logger } = require('../logger/Logger');
const idealCalc = require('../jobs/alertsAndNotifications/calcIdealTime').idealTimeCalc
const activityJob = require('./alertsAndNotifications/activityCreatedJob');

exports.ReciveJobs = async (req, res) => {
    try {
        const docs = req.body.docs;
        await addAlertJob(docs);
        return res.json({ code: 200, data: null, message: 'Activity processed...', error: null });
        // await Promise.all(docs.map(addAlertJob));
    } catch (err) {
        return res.json({ code: 400, data: null, message: 'Error occured...', error: err });

    }
}

const addAlertJob = async (docs) => {
    try {
        if (docs.length === 0) return;
        await Promise.all([
            idealCalc(docs),
            activityJob.activityCreatedJobs(docs[0].attendance_id, docs)
        ])
        // await idealCalc(doc);
        // await activityJob.activityCreatedJobs(doc.attendance_id, doc)
        // return jobs.queue.enqueue('activityCreatedJob', [doc.attendance_id, doc._id]);
    } catch (err) {
        throw err;
    }
};

exports.processRule = async (req, res) => {
    try {
        const { ruleId, eventType } = req.body;
        await jobs.queue.enqueue('ruleLifetimeEventJob', [ruleId, eventType]);
        return res.json({ code: 200, data: null, message: 'Rule processed...', error: null });
    } catch (err) {
        return res.json({ code: 400, data: null, message: 'Error occured', error: null });
    }
}