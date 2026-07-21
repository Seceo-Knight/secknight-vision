const { BaseModel } = require('../../../models/BaseModel');
const { NotificationRulesModel, NotificationRuleConditionsModel } = require('../../../routes/v3/alertsAndNotifications/Models');
const AppNames = require('../../../routes/v3/organization/appNames/Model');

const idOnly = {
    type: 'object',
    required: ['id'],
    properties: {
        id: {
            type: 'number',
            example: 1
        },
    },
};

const notificationRuleCondition = {
    type: 'object',
    required: ['type', 'cmp_operator', 'cmp_argument'],
    properties: {
        type: BaseModel.enumDesc('Type', NotificationRuleConditionsModel.TYPES),
        cmp_operator: BaseModel.enumDesc(
            'Type', NotificationRuleConditionsModel.CMD_OPERATORS
        ),
        cmp_argument: {
            type: 'string',
            example: '10',
        },
    },
};

const notificationRuleRecipient = {
    type: 'object',
    required: ['user_id'],
    properties: {
        user_id: {
            type: 'number',
            example: '1',
        },
    },
};

const ids = {
    type: 'array',
    items: { type: 'integer', example: 1 },
};

const included = {
    type: 'object',
    required: ['user_id'],
    properties: {
        ids: ids,
        departments: ids,
        locations: ids,
        all_employees: { type: 'integer', enum: [0, 1], example: 1 },
        all_locations: { type: 'integer', enum: [0, 1], example: 1 },
        all_departments: { type: 'integer', enum: [0, 1], example: 1 }
    },
};

const notificationRule = {
    type: 'object',
    required: ['name', 'type', 'conditions', 'recipients'],
    properties: {
        name: { type: 'string', example: 'My notification rule.' },
        note: { type: 'string', example: 'My notification rule note.' },
        type: BaseModel.enumDesc('Type', NotificationRulesModel.TYPES),
        risk_level: BaseModel.enumDesc('Type', NotificationRulesModel.RISK_LEVELS),
        is_multiple_alerts_in_day: {
            type: 'boolean',
            example: true,
        },
        is_action_notify: {
            type: 'boolean',
            example: true,
        },
        conditions: {
            type: 'array',
            items: notificationRuleCondition,
        },
        recipients: {
            type: 'array',
            items: notificationRuleRecipient,
        },
        include_employees: included,
        exclude_employees: included,
    },
};

const sortDir = {
    type: 'string',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
};

const sortBy = (name) => {
    return {
        name: `sort_by[${name}]`,
        schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            example: 'ASC',
        },
        description: `
Sort order:
* ASC - Ascending, from A to Z
* DESC - Descending, from Z to A`,
    }
};


const notificationAlertSortBy = {
    type: 'object',
    required: [],
    properties: {
        datetime: sortDir,
        employee: sortDir,
        computer: sortDir,
        policy: sortDir,
        risk_level: sortDir,
        behavior_rule: sortDir,
        action: sortDir,
    },
};

const applicationName = {
    type: 'object',
    required: ['type', 'name'],
    properties: {
        type: { ...BaseModel.enumDesc('Type', Object.keys(AppNames.TYPES).map(x => +x)), type: 'number', example: 1 },
        name: { type: 'string', example: 'google.com' },
    },
};

const userProperty = {
    type: 'object',
    required: ['name', 'value'],
    properties: {
        name: {
            type: 'string',
            example: 'propertyName',
        },
        value: {
            type: 'string | number | boolean | object',
            example: 'Property string value',
        },
    },
};


const geoLocationProperty = {
    type: 'object',
    required: ['lon', 'lat', 'distance'],
    properties: {
        location: {
            type: 'string',
            example: 'bangalore',
        },
        lon: {
            type: 'number',
            example: 51.507351,
        },
        lat: {
            type: 'number',
            example: -0.127758,
        },
        distance: {
            type: 'number',
            example: 100,
        },
    },
};

const projectBasedProperty = {
    type: 'object',
    properties: {
        id: {
            type: 'number',
            example: 0,
        }
    },
}

const arrayofLocations = {
    type: 'array',
    items: geoLocationProperty,
}

const userProperties = {
    type: 'array',
    items: userProperty,
};

const arrayOfString = {
    type: 'string',
    example: 'string value',
};

const arrayOfStrings = {
    type: 'array',
    items: arrayOfString,
};
const bool = { type: 'boolean', example: false };
const zeroOne = { type: 'number', enum: ['0', '1'], example: '0' };
const productiveHour = { type: 'string', example: '08:30' };
const productiveMode = { type: 'string', enum: ['fixed', 'unlimited'], example: 'fixed' };

const day = {
    type: 'object',
    required: [],
    properties: {
        status: { ...bool, description: 'true means track else no tracking that day' },
        time: {
            type: 'object',
            required: [],
            properties: {
                start: { type: 'string', example: '10:00' },
                end: { type: 'string', example: '19:00' },
            },
        },
    },
};
const days = {
    type: 'object',
    required: [],
    properties: {
        mon: day,
        tue: day,
        wed: day,
        thu: day,
        fri: day,
        sat: day,
        sun: day,
    },
};
const trackData = {
    type: 'object',
    required: [],
    properties: {
        system: {
            type: 'object',
            required: [],
            properties: {
                type: { ...zeroOne, description: '0 - personal, 1 - company' },
                visibility: bool,
                autoUpdate: { ...zeroOne, description: '0 - no update, 1 - for update' },
                tracking: { type: 'number', enum: ['0', '1'], example: 1 },
            }
        },
        screenshot: {
            type: 'object',
            required: [],
            properties: {
                frequencyPerHour: { type: 'integer', example: 30 },
                employeeAccessibility: bool,
                employeeCanDelete: bool,
            },
        },
        breakInMinute: { type: 'integer', example: 30 },
        idleInMinute: { type: 'integer', example: 2 },
        timesheetIdleTime: { type: 'string', example: '00:00' },
        trackingMode: {
            type: 'string',
            enum: ['unlimited', 'fixed', 'networkBased', 'manual', 'projectBased', 'urlBased'],
            example: 'unlimited',
        },
        tracking: {
            type: 'object',
            required: [],
            properties: {
                unlimited: {
                    type: 'object',
                    required: [],
                    properties: {
                        day: { type: 'string', example: '1,2,3,4,5,6,7', description: '1-monday,7-sunday' },
                    },
                },
                fixed: days,
                networkBased: {
                    type: 'object',
                    properties: {
                        networkName: { type: 'string', example: 'globussoft' },
                        ipAddress: { type: 'string', example: '202.83.19.158' },
                        officeNetwork: { type: 'string', example: "true" },
                    },
                },
                manual: { type: 'object' },
                projectBased: { type: 'array', items: projectBasedProperty },
                urlBased: { type: 'array', example: ['www.google.com'] },
                app: {
                    type: 'object',
                    properties: {
                        monitorOnly: {
                            ...arrayOfStrings,
                            description: 'EMPMonitor will only monitor the application listed in this category.' +
                                ' No other application will be monitored apart from this list.',
                            example: ['facebook', 'google chrome'],
                        },
                        suspendWhenUsed: {
                            ...arrayOfStrings,
                            description: 'EMPMonitor will suspend monitoring' +
                                ' if a user of that organization has accessed any application' +
                                ' which lies within this list of applications.',
                            example: ['wallet', 'bankApp'],
                        },
                        suspendKeystrokesWhenUsed: {
                            ...arrayOfStrings,
                            description: 'Keystroke will not be captured for the applications' +
                                ' which are listed within this category.' +
                                ' Everywhere else EMPMonitor will capture the keystrokes except these lists.',
                            example: ['wallet', 'bankApp'],
                        },
                        idleTimeThreshold: {
                            type: 'integer',
                            description: 'Admin can set an idle time threshold from here,' +
                                ' if a user is idle for more than the specified hrs than rest hrs will be treated as ideal.' +
                                ' Ex- if the threshold has been set to 10 mins and the user is ideal for 20 mins' +
                                ' then ideal time will be 20 min -10 mins = 10 mins ideal.',
                            example: 10,
                        },
                        appBlockList: {
                            ...arrayOfStrings,
                            description: 'its array of strings.',
                            example: ['application1', 'application2'],
                        },
                        daysAndTimes: days,
                    },
                },
                domain: {
                    type: 'object',
                    properties: {
                        monitorOnly: {
                            ...arrayOfStrings,
                            description: 'Website listed in this list will only be monitored,' +
                                ' if this list is empty than all websites will be monitored',
                            example: ['www.facebook.com', 'www.google.com'],
                        },
                        suspendMonitorWhenVisited: {
                            ...arrayOfStrings,
                            description: 'If a user of this organization has visited any website which lies' +
                                ' within the mentioned list in this section then monitoring should be suspended.',
                            example: ['www.paypal.com', 'www.stripe.com'],
                        },
                        suspendMonitorWhenVisitedInCategory: {
                            ...arrayOfStrings,
                            description: 'If a user of this organization has visited any website of category' +
                                ' which lies within the mentioned list in this section then monitoring should be suspended.',
                            example: ['bank', 'gov'],
                        },
                        suspendMonitorWhenContains: {
                            ...arrayOfStrings,
                            description: 'Monitoring should be suspended' +
                                ' if any website contains the content mentioned in the list of this section.',
                            example: ['bank', 'private'],
                        },
                        suspendPrivateBrowsing: {
                            ...bool,
                            description: 'If admin checks this then private browsing will not be captured.',
                        },
                        suspendKeystrokesWhenVisited: {
                            ...arrayOfStrings,
                            description: 'If admin has set some list of URL inside this list' +
                                ' then keystroke will not be captured for these URLs.',
                            example: ['www.paypal.com', 'www.stripe.com'],
                        },
                        suspendKeystrokesPasswords: {
                            ...bool,
                            description: 'If this has been set to OFF then keystroke' +
                                ' will not be monitored for all the password fields a user is visiting.',
                        },
                        websiteBlockList: {
                            ...arrayOfStrings,
                            description: 'its array of strings.',
                            example: ['website1', 'website2'],
                        },
                        daysAndTimes: days,
                    },
                },
                geoLocation: {
                    ...arrayofLocations,
                    description: 'GeoLocations listed in this list will only be tracked,' +
                        ' if this Location list is empty user will be tracked at all locations'
                }
            },
        },
        task: {
            type: 'object',
            required: [],
            properties: {
                employeeCanCreateTask: bool,
            },
        },
        features: {
            type: 'object',
            required: [],
            properties: {
                application_usage: zeroOne,
                keystrokes: zeroOne,
                web_usage: zeroOne,
                block_websites: zeroOne,
                screenshots: zeroOne,
                screen_record: zeroOne
            },
        },
        pack: {
            type: 'object',
            required: [],
            properties: {
                id: { type: 'integer', example: 1 },
                expiry: { type: 'date', example: '2037-12-12' }
            },
        },
        screenRecord: {
            type: 'object',
            required: [],
            properties: {
                ultrafast_1280_21: zeroOne,
                ultrafast_1080_21: zeroOne,
                ultrafast_720_21: zeroOne
            },
        },
        productiveHours: {
            type: 'object',
            required: [],
            properties: {
                hour: productiveHour,
                mode: productiveMode,
            },
        },
        agentUninstallCode: { type: 'string', example: 'test123' },
        manual_clock_in: { type: 'number', example: '1' },
        usbDisable: { type: 'number', example: '0' },
        "isSilahMobileGeoLocation": { type: 'number', example: '0' },
        "silahMobileGeoLocationFrequency": { type: 'number', example: '30' },
        productivityCategory: { type: 'number', example: '0' },
        "screencastEnable": { type: 'number', example: '0' },
        screen_record: {
            type: 'object',
            required: [],
            example: {
                is_enabled: 0,
                video_quality: 2,
            },
            properties: {
                is_enabled: { type: 'number', example: '0' },
                video_quality: { type: 'number', example: '2' },
            }
        },
        screen_record_when_website_visit: {
            ...arrayOfStrings,
            description: 'its array of strings.',
            example: ['google.com', 'facebook.com'],
        },
        screenshot_exclude_websites: {
            ...arrayOfStrings,
            description: 'its array of strings.',
            example: ['google.com', 'facebook.com'],
        },
        screenshot_exclude_application: {
            ...arrayOfStrings,
            description: 'its array of strings.',
            example: ['chrome.exe', 'edge.exe'],
        },
    },
};

const orgUpdateFeature = {
    type: 'object',
    required: [],
    properties: {
        group_id: {
            type: 'number',
            example: 0,
        },
        type: {
            type: 'number',
            example: 0,
        },
        track_data: trackData,
    },
};

// employee advance track data 
const emp_advance_track_data = {
    ...trackData
}
emp_advance_track_data.properties.is_attendance_override = { type: 'number', example: '1' };

const empAdvancedSettingsUpdate = {
    type: 'object',
    required: [],
    properties: {
        employee_id: {
            type: 'number',
            example: 0
        },
        group_id: {
            type: 'number',
            example: 0,
        },
        type: {
            type: 'number',
            example: 0,
        },
        track_data: emp_advance_track_data
    },
};

module.exports = {
    notificationRuleCondition,
    notificationRuleRecipient,
    notificationRule,
    idOnly,
    userProperties,
    arrayOfStrings,
    applicationName,
    sortBy,
    orgUpdateFeature,
    empAdvancedSettingsUpdate,
    arrayofLocations,
};