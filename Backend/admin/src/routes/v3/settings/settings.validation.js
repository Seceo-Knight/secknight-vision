const Joi = require('joi');
const isMacAddress = require('is-mac-address')

const processErrors = (validation) => {
    if (!validation.error) return validation;
    const errorMessages = {};
    validation.error.details.forEach((detail) => {
        const key = detail.path.join('.');
        errorMessages[key] = key in errorMessages ? errorMessages[key] : [];
        errorMessages[key].push(detail.message);
    });
    return { ...validation, errorMessages };
};

class SettingsValidation {
    customEmpSettingValidation(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required().positive(),
            track_data: Joi.object().required(),
        });
        var result = Joi.validate(params, schema);
        return result;
    }


    empTrackingModeValidation(params) {
        const schema = Joi.object().keys({
            trackingMode: Joi.string().valid(['unlimited', 'fixed', 'networkBased', 'manual', 'projectBased']).error(() => 'trackingMode unlimited, fixed, networkBased, manual, projectBased are Allowed.'),
        });
        return Joi.validate(params, schema);
    }

    empIdValidation(params) {
        const schema = Joi.object().keys({
            employee_id: Joi.number().required().positive()
        });
        return Joi.validate(params, schema);
    }

    customEmpSettingValidation_new(params) {
        const joi = Joi
            .extend((joi) => {
                const formatRegExp = /([0-1][0-9]|2[0-3]):[0-5][0-9]/;
                return {
                    name: 'time',
                    base: joi.string(),
                    language: {
                        base: '!!"{{key}}" must be in a valid format',
                        greater: '!!"{{key}}" must be greater than {{time}}',
                    },
                    pre(value, state, options) {
                        if (formatRegExp.test(value)) return value;
                        return this.createError('time.base', { value }, state, options);
                    },
                    rules: [{
                        name: 'greater',
                        params: {
                            time: joi.alternatives([joi.string().required(), joi.func().ref().required()]),
                        },
                        validate(params, value, state, options) {
                            const time = joi.isRef(params.time) ? state.parent[params.time.key] : params.time;
                            if (value > time) {
                                return value;
                            }
                            return this.createError('time.greater', { value, time }, state, options);
                        }
                    },],
                };
            })
            .extend((joi) => {
                return {
                    name: 'mac',
                    base: joi.string(),
                    language: {
                        base: '!!"{{key}}" must be in a valid MAC address',
                    },
                    pre(value, state, options) {
                        if (isMacAddress.isMACAddress(value.replace(/-/g, ":"))) return value;
                        return this.createError('time.base', { value }, state, options);
                    },
                };
            });
        const any = () => joi.any();
        const obj = () => joi.object().unknown(true);
        const str = () => joi.string();
        const int = () => num().integer();
        const num = () => joi.number();
        const zeroOne = () => Joi.number().integer().valid([0, 1]);
        const mac = () => joi.mac();

        const bool = () => joi.boolean();
        const time = () => joi.time();

        const day = () => {
            return obj().keys({
                status: bool().allow("true", "false"),
                time: obj().keys({
                    start: time().required(),
                    // end: time().greater(joi.ref('start')).required()
                    //     .error(_ => 'End time must be more than start time'),
                    end: time().required()
                }),
            });
        };
        const days = () => obj().keys({
            mon: day(),
            tue: day(),
            wed: day(),
            thu: day(),
            fri: day(),
            sat: day(),
            sun: day(),
        });
        const arrayOfStrings = () => joi.array().items(joi.string());
        const arrayOfNumbers = () => joi.array().items(joi.number());

        const schema = Joi.object().required().keys({
            employee_id: num().default(0),
            group_id: num().default(0),
            type: num().valid(1, 2, 3).required(),
            track_data: obj().required().keys({
                system: obj().keys({
                    type: num().error(_ => 'Inavlid Input For System Type'),
                    visibility: bool().error(_ => 'Inavlid Input For System visibility'),
                    autoUpdate: zeroOne().default('0'),
                    tracking: zeroOne().default(1),
                }),
                screenshot: obj().keys({
                    frequencyPerHour: num().integer().required().error(_ => 'frequencyPerHour is must be a number'),
                    employeeAccessibility: bool().error(_ => 'Inavlid Input For employeeAccessibility'),
                    employeeCanDelete: bool().error(_ => 'Inavlid Input For employeeCanDelete'),
                }),
                breakInMinute: num().integer().default(30).error(_ => 'breakInMinute is must be a number'),
                idleInMinute: num().integer().required().error(_ => 'idleInMinute is must be a number'),
                timesheetIdleTime: str().default("00:00").regex(/[0-5][0-9]:[0-5][0-9]/).error(_ => 'Timesheet idle time is must be a max of 59 min and 59 sec'),
                trackingMode: str().valid(['unlimited', 'fixed', 'networkBased', 'manual', 'projectBased', 'geoLocation'])
                    .error(() => 'trackingMode unlimited, fixed, networkBased, manual, projectBased are Allowed.'),
                tracking: obj().keys({
                    unlimited: obj().keys({
                        day: str(),
                    }),
                    fixed: days(),
                    networkBased: joi.alternatives().try(
                        joi.object().keys({
                            networkName: joi.string().allow(null),
                            ipAddress: joi.alternatives([
                                mac(),
                                joi.string().ip({
                                    version: ['ipv4', 'ipv6'],
                                    cidr: 'optional'
                                })
                            ]).allow(null),
                            officeNetwork: joi.boolean().strict().allow("true", "false")
                        }),
                        joi.array().items(
                            joi.object().keys({
                                networkName: joi.string().allow(null),
                                ipAddress: joi.alternatives([
                                    mac(),
                                    joi.string().ip({
                                        version: ['ipv4', 'ipv6'],
                                        cidr: 'optional'
                                    })
                                ]).allow(null),
                                officeNetwork: joi.boolean().strict().allow("true", "false")
                            })
                        )
                    ).default([]),
                    manual: obj(),
                    projectBased: Joi.array().items(obj().keys({
                        id: joi.number().allow(null)
                    })).default([]),
                    app: obj().keys({
                        monitorOnly: arrayOfStrings(),
                        suspendWhenUsed: arrayOfStrings(),
                        suspendKeystrokesWhenUsed: arrayOfStrings(),
                        idleTimeThreshold: int(),
                        daysAndTimes: days(),
                        appBlockList: arrayOfStrings().default([]),
                    }),
                    domain: obj().keys({
                        monitorOnly: arrayOfStrings().default([]),
                        suspendMonitorWhenVisited: arrayOfStrings().default([]),
                        suspendMonitorWhenVisitedInCategory: arrayOfStrings().default([]),
                        suspendMonitorWhenContains: arrayOfStrings().default([]),
                        suspendPrivateBrowsing: bool().default(false),
                        suspendKeystrokesWhenVisited: arrayOfStrings().default([]),
                        suspendKeystrokesPasswords: bool().default(false),
                        daysAndTimes: days().default({}),
                        websiteBlockList: arrayOfStrings().default([]),

                    }).default({
                        "monitorOnly": [],
                        "suspendMonitorWhenVisited": [],
                        "suspendMonitorWhenVisitedInCategory": [],
                        "suspendMonitorWhenContains": [],
                        "suspendPrivateBrowsing": false,
                        "suspendKeystrokesWhenVisited": [],
                        "suspendKeystrokesPasswords": false,
                        "daysAndTimes": {},
                        "websiteBlockList": []
                    }),
                    geoLocation: Joi.array().items(
                        Joi.object().keys({
                            location: Joi.string().required(),
                            lat: Joi.number().precision(10).error(() => { return "Latitude should be a decimal number" }),
                            lon: Joi.number().precision(10).error(() => { return "Longitude should be a decimal number" }),
                            distance: Joi.number().min(100).error(() => { return "Range must be larger than or equal to 100 meters" })
                        })
                    ).default([]),
                }),
                task: obj().keys({
                    employeeCanCreateTask: bool().error(_ => 'Inavlid Input For employeeCanCreateTask'),
                }),
                features: obj().keys({
                    application_usage: zeroOne().required().error(_ => 'Invalid Input for application_usage.'),
                    keystrokes: zeroOne().error(_ => 'Invalid Input for keystrokes'),
                    web_usage: zeroOne().required().error(_ => 'Invalid Input for web_usage'),
                    block_websites: zeroOne().required().error(_ => 'Invalid Input for block_websites'),
                    screenshots: zeroOne().required().error(_ => 'Invalid Input for screenshots'),
                    screen_record: zeroOne().optional().default(0).error(_ => 'Invalid Input for screen record')
                }),
                pack: obj().keys({
                    id: int(),
                    expiry: str(),
                }),
                screenRecord: obj().keys({
                    ultrafast_720_21: zeroOne().optional().default().error(_ => 'Inavlid Input For screen quality'),
                    ultrafast_1080_21: zeroOne().optional().default().error(_ => 'Inavlid Input For screen quality'),
                    ultrafast_1280_21: zeroOne().integer().optional().default().error(_ => 'Inavlid Input For screen quality'),
                }),
                agentUninstallCode: Joi.string().optional().allow(['', ""]).default(''),
                manual_clock_in: num().integer().valid(0, 1).default(0),
                is_attendance_override: num().integer().valid(0, 1).default(0),
                usbDisable: num().integer().valid(0, 1).default(0),
                userBlock: num().integer().valid(0, 1).default(0),
                block: Joi.when('userBlock', {
                    is: Joi.boolean().valid(true, 1),
                    then: obj().keys({
                        contact: Joi.string().required(),
                        email: Joi.string().required(),
                        logo: Joi.string().optional().default(null)
                    }).required(),
                }),
                systemLock: num().integer().valid(0, 1).default(0),
                isSilahMobileGeoLocation: num().integer().valid(0, 1).default(0),
                silahMobileGeoLocationFrequency: num().integer().valid(5, 10, 15, 30, 45, 60).default(30),
                screen_record: obj().keys({
                    is_enabled: num().integer().valid(0, 1).default(0),
                    video_quality: Joi.number().valid(1, 2, 3).default(2),
                    audio: num().integer().valid(0, 1).default(0),
                }),
                screen_record_when_website_visit: arrayOfStrings(),
                screenshot_exclude_websites: arrayOfStrings(),
                screenshot_exclude_application: arrayOfStrings(),
            }),
        });
        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

    groupWebBlockingValidation (params) {
        const schema = Joi.object().required().keys({
            group_id: Joi.number().required(),
            website: Joi.array().items(Joi.string()),
            type: Joi.number().required()
        });
        
        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

    enableAgentNotification(params){
        const schema = Joi.object().keys({
            is_enable: Joi.string().valid("true", "false").required()
        })
        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

    groupAppBlockingValidation (params) {
        const schema = Joi.object().required().keys({
            group_id: Joi.number().required(),
            application: Joi.array().items(Joi.string()),
            type: Joi.number().required()
        });

        return processErrors(Joi.validate(params, schema, { abortEarly: false }));
    }

}

module.exports = new SettingsValidation;