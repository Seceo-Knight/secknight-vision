const {ObjectID: ObjectId} = require('mongodb');
const moment = require('moment-timezone');
const {assert, fixtures, travelTo} = require('../helpers/common');

const {EmployeeActivityModel} = require('../../models/employee_activities.schema');
const {queue, worker, redis} = require('../../jobs');
const {NotificationRulesModel} = require('../../routes/v3/alertsAndNotifications/Models');
const {EmployeeAttendanceModel} = require('../../routes/v3/employee/EmployeeAttendanceModel');

const {Mailer} = require('../../messages/Mailer');
const {Firebase} = require('../../messages/Firebase');
const {WebSocketNotification} = require('../../messages/WebSocketNotification');

const PushNotifications = process.env.PUSH_NOTIFICATION_TRANSPORT === 'firebase' ? Firebase : WebSocketNotification;

beforeEach(async () => {
    await fixtures.load();
    await EmployeeActivityModel.deleteMany({attendance_id: 1});
    await queue.delQueue('default');
    const keys = await redis.keys('*');
    if (keys.length > 0) {
        await redis.del(keys);
    }
    await Mailer.Mock.reset();
    await PushNotifications.Mock.reset();
});

const commonRuleParams = {
    name: 'Rule 1 test',
    note: 'test',
    include_employees: {ids: [1]},
    exclude_employees: {},
    is_action_notify: true,
    is_multiple_alerts_in_day: true,
    organization_id: 1,
    type: 'ASA',
    conditions: [
        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
    ],
    recipients: [{user_id: 1}],
};

const addActivity = async (startTime, endTime, attendance_id = 0) => {
    const startTimestamp = +(new Date(startTime));
    const endTimestamp = +(new Date(endTime));
    const duration = (endTimestamp - startTimestamp) / 1000;
    if (!attendance_id) {
        const result = await EmployeeAttendanceModel.create({
            employee_id: 1, organization_id: 1,
            date: moment(startTimestamp).utc().format('YYYY-MM-DD'),
            start_time: moment(startTimestamp).format('YYYY-MM-DD HH:mm:ss'),
            end_time: moment(endTimestamp).format('YYYY-MM-DD HH:mm:ss'),
        });
        attendance_id = result.insertId;
    }

    return EmployeeActivityModel.insertMany([
        {
            attendance_id,
            application_id: ObjectId('5ed5efbcbc38f0682ce3549d'),
            domain_id: ObjectId('5ed7485dcbe04f3d8a81ae53'),
            url: 'https://github.com/features/code-review/',
            task_id: null,
            project_id: null,
            start_time: startTime,
            end_time: endTime,
            total_duration: duration,
            active_seconds: 2345,
            keystrokes_count: 33,
            mouseclicks_count: 0,
            mousemovement_count: 0,
            keystrokes: 'asdhafk ofhasiguifhag fh ga lghlf',
        }
    ]);
};

const perform = async (queued) => {
    await worker.perform(queued);
    await queue.del(queued.class, queued.args);
    await queue.delDelayed(queued.class, queued.args);
};

const lastEnqueued = async () => {
    const enqueued = await queue.queued(0, 10000);
    return enqueued.pop();
};

const lastEnqueuedAt = async () => {
    const enqueuedAt = await queue.allDelayed();
    const timestamp = Object.keys(enqueuedAt).pop();
    const enqueued = enqueuedAt[timestamp];
    if (!enqueued) return;
    return {timestamp: +timestamp, enqueued: enqueued[enqueued.length - 1]};
};

const firebaseRecipient = 'eQW4odWupNAHqmgTnzQIqf:APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HH' +
    'mQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ';

const pushNotificationsLastMessage = () => {
    try {
        const {recipients, message} = PushNotifications.Mock.lastMessage();
        const [recipient] = recipients;
        const {title, body} = message.params.notification;
        return {recipient, title, body};
    } catch (e) {
        return;
    }
};

const insertRule = async (params) => {
    const now = new Date();
    now.setFullYear(now.getFullYear() - 1);
    await NotificationRulesModel.create({
        created_at: now,
        updated_at: now,
        ...commonRuleParams,
        ...params,
    });
};


const prepareRule = async (params) => {
    await NotificationRulesModel.delete(1);
    await insertRule(params);
    await redis.flushdb();
};

describe('alertsAndNotifications', async () => {
    describe('activityCreatedJob', async () => {
        it('Background job should be added on employee activity added.', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await addActivity('2036-01-01 08:00:00', '2036-01-01 09:00:00', 1);
                let enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'activityCreatedJob');
                assert.equal(enqueued.args[0], 1);
                await perform(enqueued);

                await addActivity('2036-01-01 10:00:00', '2036-01-01 11:00:00', 1);
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'activityCreatedJob');
                assert.equal(enqueued.args[0], 1);
                await perform(enqueued);

                const lastActivity = await EmployeeActivityModel.findOne().sort('-_id');
                assert.equal(lastActivity.total_duration, 3600);
                lastActivity.total_duration += 120;
                await lastActivity.save();
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'activityCreatedJob');
                assert.equal(enqueued.args[0], 1);

                const attendanceKey = 'attendance.1';
                const attendanceByActivityKey = 'attendance.1.5ed5efbcbc38f0682ce3549d.5ed7485dcbe04f3d8a81ae53';
                assert.equal(JSON.parse(await redis.get(attendanceKey)).duration, 7200);
                assert.equal(JSON.parse(await redis.get(attendanceByActivityKey)).duration, 7200);

                await perform(enqueued);

                assert.equal(JSON.parse(await redis.get(attendanceKey)).duration, 7320);
                assert.equal(JSON.parse(await redis.get(attendanceByActivityKey)).duration, 7320);
            });
        });
    });

    describe('When someone is absent.', async () => {
        it('Send mail if employee absent 3 days', async () => {
            await travelTo(new Date('2036-08-02 08:00:00'), async () => {
                await NotificationRulesModel.delete(1);
                await perform(await lastEnqueued());
                await NotificationRulesModel.create({
                    ...commonRuleParams,
                    type: 'ABT',
                    conditions: [
                        {type: 'ABT', cmp_operator: '=', cmp_argument: 3}
                    ],
                    include_employees: {ids: [1, 2]},
                });
                await perform(await lastEnqueued());
                const delayedTasks = await queue.allDelayed();
                const timestamp = +Object.keys(delayedTasks)[0];
                assert.equal(moment(timestamp).format('YYYY-MM-DD HH:mm:ss'), '2036-08-06 16:00:00');
                const flatDelayedTasks = [].concat(...Object.values(delayedTasks));
                assert.equal(flatDelayedTasks.length, 2);
                for (const enqueued of flatDelayedTasks) {
                    assert.equal(enqueued.class, 'sendAlertJob');
                    await perform(enqueued);
                }

                let messages = Mailer.Mock.messages();
                assert.equal(messages.length, 2);
                messages.forEach((message, index) => {
                    const {from, to, subject, text} = message;
                    assert.equal(from, 'admin@empmonitor.com');
                    assert.equal(to, 'Bob Admin <admin@example.com>');
                    assert.equal(subject, 'Employee is absent for 3 day(s).');
                    assert.equal(text, `Employee Bob Employee${index + 1} (employee${index + 1}@example.com) is absent for 3 day(s).`);
                });

                messages = PushNotifications.Mock.messages();
                assert.equal(messages.length, 2);
                messages.forEach((message, index) => {
                    const {title, body} = message.message.params.notification;
                    assert.equal(title, 'EmpMonitor');
                    assert.equal(body, `Employee Bob Employee${index + 1} (employee${index + 1}@example.com) is absent for 3 day(s).`);
                });
            });
            await travelTo(new Date('2036-01-07 08:00:00'), async () => {
                await addActivity('2036-01-07 08:00:00', '2036-01-07 08:20:00');
                await perform(await lastEnqueued());
                const {timestamp, enqueued} = await lastEnqueuedAt();
                assert.equal(enqueued.class, 'sendAlertJob');
                assert.equal(moment(timestamp).format('YYYY-MM-DD HH:mm:ss'), '2036-01-10 17:00:00');
            });
            await travelTo(new Date('2036-01-08 08:00:00'), async () => {
                await addActivity('2036-01-08 08:00:00', '2036-01-08 07:20:00');
                await perform(await lastEnqueued());
                const {timestamp, enqueued} = await lastEnqueuedAt();
                assert.equal(enqueued.class, 'sendAlertJob');
                assert.equal(moment(timestamp).format('YYYY-MM-DD HH:mm:ss'), '2036-01-11 17:00:00');
            });
        });
    });

    describe('When someone accesses a specified web page or applications.', async () => {
        it('Accesses a specified web page', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await prepareRule({
                    type: 'ASA',
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });

                await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
                let enqueued = await lastEnqueued();
                await perform(enqueued);
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee accesses a specified web page.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) accesses "1001fonts.com" web page.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) accesses "1001fonts.com" web page.');
            });
        });
        it('Accesses a specified application', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await NotificationRulesModel.delete(1);
                await NotificationRulesModel.create({
                    ...commonRuleParams,
                    type: 'ASA',
                    conditions: [
                        {type: 'APP', cmp_operator: '=', cmp_argument: '5ed5efbcbc38f0682ce3549d'}
                    ],
                });

                await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
                let enqueued = await lastEnqueued();
                await perform(enqueued);
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee accesses a specified application.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) accesses "10.1.2.162" application.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) accesses "10.1.2.162" application.');
            });
        });
    });

    describe('When daily work time is less or greater than specified hours/minutes.', async () => {
        it('more', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await NotificationRulesModel.delete(1);
                await perform(await lastEnqueued());
                await NotificationRulesModel.create({
                    ...commonRuleParams,
                    type: 'DWT',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });
                await perform(await lastEnqueued());
                assert.isNotOk(await lastEnqueuedAt());

                await addActivity('2036-01-01 09:00:00', '2036-01-01 18:31:00');
                let enqueued = await lastEnqueued();
                await perform(enqueued);
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee daily work time is greater than 30 minutes.');
                assert.equal(
                    text,
                    'Employee Bob Employee1 (employee1@example.com) daily work time is 9 hours 31 minutes.',
                );

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(
                    body,
                    'Employee Bob Employee1 (employee1@example.com) daily work time is 9 hours 31 minutes.',
                );
            });
        });
        it('less', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await NotificationRulesModel.delete(1);
                await perform(await lastEnqueued());
                const result = await NotificationRulesModel.create({
                    ...commonRuleParams,
                    type: 'DWT',
                    conditions: [
                        {type: 'MNT', cmp_operator: '<', cmp_argument: 30}
                    ],
                });
                await perform(await lastEnqueued());
                const {timestamp: timestamp0, enqueued: enqueued0} = await lastEnqueuedAt();
                assert.equal(enqueued0.class, 'DWTLessJob');
                assert.equal(moment(timestamp0).format('YYYY-MM-DD HH:mm:ss'), '2036-01-01 17:00:00');
                queue.delDelayed('DWTLessJob', [1, 1]);

                await EmployeeAttendanceModel.update(1, {date: '2036-01-01'});
                await addActivity('2036-01-01 09:00:00', '2036-01-01 17:29:00', 1);
                await perform(await lastEnqueued());
                let {timestamp, enqueued} = await lastEnqueuedAt();
                assert.equal(enqueued.class, 'DWTLessJob');
                assert.equal(moment(timestamp).format('YYYY-MM-DD HH:mm:ss'), '2036-01-01 17:00:00');
                await perform(enqueued);
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee daily work time is less than 30 minutes.');
                assert.equal(
                    text,
                    'Employee Bob Employee1 (employee1@example.com) daily work time is 8 hours 29 minutes.',
                );

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(
                    body,
                    'Employee Bob Employee1 (employee1@example.com) daily work time is 8 hours 29 minutes.',
                );
            });
        });
    });

    describe('When someone is idle for more than specified minutes.', async () => {
        it('alert if idle more than 130', async () => {
            await travelTo(new Date('2036-01-01 09:30:00'), async () => {
                await prepareRule({
                    type: 'IDL',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 130}
                    ],
                });

                await addActivity('2036-01-01 09:00:00', '2036-01-01 09:30:00');
                await perform(await lastEnqueued());
                const {timestamp, enqueued} = await lastEnqueuedAt();
                assert.equal(enqueued.class, 'sendAlertJob');
                assert.equal(moment(timestamp).format('YYYY-MM-DD HH:mm:ss'), '2036-01-01 11:40:01');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee idle for more than 2 hours 10 minutes.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) idle for more than 2 hours 10 minutes.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) idle for more than 2 hours 10 minutes.');
            });
        });
    });

    describe('When someone ends early by specified minutes.', async () => {
        it('ends early 30 minutes', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await prepareRule({
                    type: 'SEE',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });
                await addActivity('2036-01-01 09:00:00', '2036-01-01 16:29:59');
                await perform(await lastEnqueued());

                let {timestamp, enqueued} = await lastEnqueuedAt();
                assert.equal(enqueued.class, 'SEEJob');
                assert.equal(moment(timestamp).format('YYYY-MM-DD HH:mm:ss'), '2036-01-01 17:00:00');

                await perform(enqueued);
                enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee ends early than 30 minutes.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) ends early than 30 minutes.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) ends early than 30 minutes.');
            });
        });
    });

    describe('When someone starts early by specified minutes.', async () => {
        it('starts early 30 minutes', async () => {
            await travelTo(new Date('2036-01-01 07:27:00'), async () => {
                await prepareRule({
                    type: 'SSE',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });

                await addActivity('2036-01-01 07:27:59', '2036-01-01 16:29:00');
                await perform(await lastEnqueued());

                const enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee starts early than 30 minutes.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) starts in 32 minutes early.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) starts in 32 minutes early.');
            });
        });
    });

    describe('When someone starts late by specified minutes.', async () => {
        it('starts late then 30 minutes', async () => {
            await travelTo(new Date('2036-01-01 07:29:00'), async () => {
                await prepareRule({
                    type: 'SSL',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });

                await addActivity('2036-01-01 08:33:01', '2036-01-01 16:29:00');
                await perform(await lastEnqueued());

                const enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee starts late than 30 minutes.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) starts in 33 minutes late.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) starts in 33 minutes late.');
            });
        });
    });

    describe('When someone spends time more than specified on specified web page or applications.', async () => {
        it('spends more then 30 minutes on domain', async () => {
            await travelTo(new Date('2036-01-01 07:29:00'), async () => {
                await prepareRule({
                    type: 'STA',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'},
                    ],
                });

                await addActivity('2036-01-01 08:00:00', '2036-01-01 08:37:59');
                await perform(await lastEnqueued());

                const enqueued = await lastEnqueued();
                assert.equal(enqueued. class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee spends more than 30 minutes on web page.');
                assert.equal(
                    text,
                    'Employee Bob Employee1 (employee1@example.com) spends 37 minutes' +
                    ' on "1001fonts.com" web page.',
                );

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(
                    body,
                    'Employee Bob Employee1 (employee1@example.com) spends 37 minutes' +
                    ' on "1001fonts.com" web page.',
                );
            });
        });
        it('spends more then 30 minutes on app', async () => {
            await travelTo(new Date('2036-01-01 07:29:00'), async () => {
                await NotificationRulesModel.delete(1);
                await perform(await lastEnqueued());
                await NotificationRulesModel.create({
                    ...commonRuleParams,
                    type: 'STA',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30},
                        {type: 'APP', cmp_operator: '=', cmp_argument: '5ed5efbcbc38f0682ce3549d'},
                    ],
                });
                await perform(await lastEnqueued());

                await addActivity('2036-01-01 08:00:00', '2036-01-01 08:35:59');
                await perform(await lastEnqueued());

                const enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(enqueued);

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee spends more than 30 minutes on application.');
                assert.equal(
                    text,
                    'Employee Bob Employee1 (employee1@example.com) spends 35 minutes' +
                    ' on "10.1.2.162" application.',
                );

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(
                    body,
                    'Employee Bob Employee1 (employee1@example.com) spends 35 minutes' +
                    ' on "10.1.2.162" application.',
                );
            });
        });
    });

    describe('When someone works on day offs.', async () => {
        it('work on sunday', async () => {
            await travelTo(new Date('2036-01-06 08:00:00'), async () => {
                await prepareRule({
                    type: 'WDO',
                    conditions: null,
                });

                await addActivity('2036-01-06 08:00:00', '2036-01-06 08:30:59');

                await perform(await lastEnqueued());

                const enqueued = await lastEnqueued();
                assert.equal(enqueued.class, 'sendAlertJob');
                await perform(await lastEnqueued());

                const {from, to, subject, text} = Mailer.Mock.lastMessage();
                assert.equal(from, 'admin@empmonitor.com');
                assert.equal(to, 'Bob Admin <admin@example.com>');
                assert.equal(subject, 'Employee works on day offs.');
                assert.equal(text, 'Employee Bob Employee1 (employee1@example.com) works on day offs.');

                const {recipient, title, body} = pushNotificationsLastMessage();
                assert.equal(recipient, firebaseRecipient);
                assert.equal(title, 'EmpMonitor');
                assert.equal(body, 'Employee Bob Employee1 (employee1@example.com) works on day offs.');
            });
        });
    });

    describe('Employees filter', async () => {
        const prepareActivity = async (params) => {
            await NotificationRulesModel.delete(1);
            await NotificationRulesModel.create({
                ...commonRuleParams,
                ...params,
            });
            await redis.flushdb();

            await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
            await perform(await lastEnqueued());
        };

        describe('Employee id', async () => {
            it('matched', async () => {
                await prepareActivity({
                    include_employees: {ids: [1]},
                });
                assert.isOk(await lastEnqueued());
            });
            it('not matched', async () => {
                await prepareActivity({
                    include_employees: {ids: [2]},
                });
                assert.isNotOk(await lastEnqueued());
            });
            it('exclude matched', async () => {
                await prepareActivity({
                    exclude_employees: {ids: [1]},
                });
                assert.isNotOk(await lastEnqueued());
            });
            it('exclude override include', async () => {
                await prepareActivity({
                    include_employees: {ids: [1]},
                    exclude_employees: {ids: [1]},
                });
                assert.isNotOk(await lastEnqueued());
            });
        });

        describe('Department id', async () => {
            it('matched', async () => {
                await prepareActivity({
                    include_employees: {departments: [1]},
                });
                assert.isOk(await lastEnqueued());
            });
            it('not matched', async () => {
                await prepareActivity({
                    include_employees: {departments: [2]},
                });
                assert.isNotOk(await lastEnqueued());
            });
            it('exclude matched', async () => {
                await prepareActivity({
                    exclude_employees: {departments: [1]},
                });
                assert.isNotOk(await lastEnqueued());
            });
            it('exclude override include', async () => {
                await prepareActivity({
                    include_employees: {departments: [1]},
                    exclude_employees: {departments: [1]},
                });
                assert.isNotOk(await lastEnqueued());
            });
        });

        describe('Location id', async () => {
            it('matched', async () => {
                await prepareActivity({
                    include_employees: {locations: [1]},
                });
                assert.isOk(await lastEnqueued());
            });
            it('not matched', async () => {
                await prepareActivity({
                    include_employees: {locations: [2]},
                });
                assert.isNotOk(await lastEnqueued());
            });
            it('exclude matched', async () => {
                await prepareActivity({
                    exclude_employees: {locations: [1]},
                });
                assert.isNotOk(await lastEnqueued());
            });
            it('exclude override include', async () => {
                await prepareActivity({
                    include_employees: {locations: [1]},
                    exclude_employees: {locations: [1]},
                });
                assert.isNotOk(await lastEnqueued());
            });
        });
    });

    describe('Action notify', async () => {
        it('on', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await prepareRule({
                    type: 'ASA',
                    is_action_notify: true,
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });

                await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
                await perform(await lastEnqueued());
                await perform(await lastEnqueued());
                assert.isOk(pushNotificationsLastMessage());
            });
        });
        it('off', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await prepareRule({
                    type: 'ASA',
                    is_action_notify: false,
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });

                await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
                await perform(await lastEnqueued());
                await perform(await lastEnqueued());
                assert.isNotOk(pushNotificationsLastMessage());
            });
        });
    });

    describe('Multiple alerts in day', async () => {
        it('on', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await prepareRule({
                    type: 'ASA',
                    is_multiple_alerts_in_day: true,
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });

                const result = await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
                await perform(await lastEnqueued());
                await perform(await lastEnqueued());
                assert.isOk(pushNotificationsLastMessage());
                PushNotifications.Mock.reset();

                await addActivity('2036-01-01 16:00:00', '2036-01-01 16:20:00', result[0].attendance_id);
                await perform(await lastEnqueued());
                await perform(await lastEnqueued());
                assert.isOk(pushNotificationsLastMessage());
            });
        });
        it('off', async () => {
            await travelTo(new Date('2036-01-01 08:00:00'), async () => {
                await prepareRule({
                    type: 'ASA',
                    is_multiple_alerts_in_day: false,
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });

                const result = await addActivity('2036-01-01 09:00:00', '2036-01-01 16:00:00');
                await perform(await lastEnqueued());
                await perform(await lastEnqueued());
                assert.isOk(pushNotificationsLastMessage());
                PushNotifications.Mock.reset();

                await addActivity('2036-01-01 16:00:00', '2036-01-01 16:20:00', result[0].attendance_id);
                await perform(await lastEnqueued());
                await perform(await lastEnqueued());
                assert.isNotOk(pushNotificationsLastMessage());
            });
        });
    });

    describe('Test multi rules per action.', async () => {
        it('Should work', async () => {
            await travelTo(new Date('2036-01-01 07:29:00'), async () => {
                await prepareRule({
                    type: 'SSE',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });
                await insertRule({
                    type: 'ABT',
                    conditions: [
                        {type: 'ABT', cmp_operator: '=', cmp_argument: 3}
                    ],
                });
                await insertRule({
                    type: 'ASA',
                    is_action_notify: true,
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });
                await insertRule({
                    type: 'ASA',
                    is_action_notify: true,
                    conditions: [
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'}
                    ],
                });
                await insertRule({
                    type: 'WDO',
                    conditions: null,
                });
                await insertRule({
                    type: 'STA',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30},
                        {type: 'APP', cmp_operator: '=', cmp_argument: '5ed5efbcbc38f0682ce3549d'},
                    ],
                });
                await insertRule({
                    type: 'STA',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30},
                        {type: 'DMN', cmp_operator: '=', cmp_argument: '5ed7485dcbe04f3d8a81ae53'},
                    ],
                });
                await insertRule({
                    type: 'SEE',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });
                await insertRule({
                    type: 'IDL',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });
                await insertRule({
                    type: 'DWT',
                    conditions: [
                        {type: 'MNT', cmp_operator: '>', cmp_argument: 30}
                    ],
                });
                await insertRule({
                    type: 'ASA',
                    conditions: [
                        {type: 'APP', cmp_operator: '=', cmp_argument: '5ed5efbcbc38f0682ce3549d'}
                    ],
                });
                await insertRule({
                    type: 'ABT',
                    conditions: [
                        {type: 'ABT', cmp_operator: '=', cmp_argument: 3}
                    ],
                });
                assert.equal(12, (await NotificationRulesModel.findAllBy()).length);
            });
        });
    });
});
