const sqlFixtures = require('sql-fixtures');
const MySql = require('../../database/MySqlConnection').getInstance();

const dbConfig = {
    client: 'mysql',
    connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DBNAME,
    }
};

const dataSpec = {
    organization_settings: [{
        id: 1,
        organization_id: 'organizations:0',
        rules: '{}',
    }],
    organizations_whitelist_ips: [{
        id: 1,
        admin_id: 'organizations:0',
        ip: '123.123.123.128',
        admin_email: 'admin@example.com',
    }],
    notification_rule_alerts: [{
        id: 1,
        notification_rule_id: 'notification_rules:0',
        employee_attendance_id: 'employee_attendance:0',
        employee_id: 'employees:0',
    }],
    employee_attendance: [
        {
            id: 1,
            employee_id: 'employees:0',
            organization_id: 'organizations:0',
            date: '2030-08-01',
            start_time: '2030-08-01 08::00::00',
            end_time: '2030-08-01 15::00::00',
        },
        {
            id: 2,
            employee_id: 'employees:0',
            organization_id: 'organizations:0',
            date: '2036-08-01',
            start_time: '2036-08-01 08::00::00',
            end_time: '2036-08-01 15::00::00',
        },
    ],
    employees: [
        {
            id: 1,
            user_id: 'users:2',
            organization_id: 'organizations:0',
            department_id: 'organization_departments:0',
            location_id: 'organization_locations:0',
            custom_tracking_rule: '{"pack"::{"expiry":: "3000-01-01"}}',
            timezone: 'Europe/Paris',
            emp_code: 'Computer ID',
            shift_id: 1,
        },
        {
            id: 2,
            user_id: 'users:3',
            organization_id: 'organizations:0',
            department_id: 'organization_departments:0',
            location_id: 'organization_locations:0',
            custom_tracking_rule: '{"pack"::{"expiry":: "3000-01-01"}}',
            timezone: 'Europe/Paris',
            emp_code: 'Computer ID',
            shift_id: 1,
        },
    ],
    organization_departments: [{ id: 1, name: 'php', organization_id: 'organizations:0' }],
    organization_locations: [{
        id: 1,
        organization_id: 'organizations:0',
        name: 'Paris',
    }],
    organization_shifts: [{
        id: 1,
        organization_id: 'organizations:0',
        name: 'Shift 1',
        data: '{"mon"::{"status"::true,"time"::{"start"::"09::00","end"::"18::00"}},"tue"::{"status"::true,"time"::{"start"::"09::00","end"::"18::00"}},"wed"::{"status"::true,"time"::{"start"::"09::00","end"::"18::00"}},"thu"::{"status"::true,"time"::{"start"::"09::00","end"::"18::00"}},"fri"::{"status"::true,"time"::{"start"::"09::00","end"::"18::00"}},"sat"::{"status"::false,"time"::{"start"::"09:00","end"::"15::00"}},"sun"::{"status"::false,"time"::{"start"::"09:00","end"::"18::00"}}}',
        created_by: 'users:0',
        updated_by: 'users:1',
        color_code: 1,
    }],
    notification_rule_recipients: [{
        id: 1,
        notification_rule_id: 'notification_rules:0',
        user_id: 'users:2',
    }],
    notification_rule_conditions: [
        { id: 1, notification_rule_id: 'notification_rules:0', type: 'HUR', cmp_operator: '<', cmp_argument: 20 },
        {
            id: 2,
            notification_rule_id: 'notification_rules:0',
            type: 'DMN',
            cmp_operator: '=',
            cmp_argument: '5ecae946b88f0a34a1856086'
        },
    ],
    notification_rules: [{
        id: 1,
        organization_id: 'organizations:0',
        name: 'Rule 1',
        note: '',
        type: 'DWT',
        risk_level: 'MR',
        is_multiple_alerts_in_day: true,
        is_action_notify: true,
        include_employees: '{"ids":: [1], "departments":: [1], "locations":: [1]}',
        exclude_employees: '{"ids":: [1], "departments":: [1], "locations":: [1]}',
    }],
    organization_settings: [{
        id: 1,
        organization_id: 'organizations:0',
        rules: '{"pack":: {"expiry":: "2035-01-01 00:00:00"}}',
    }],
    organizations: [{
        id: 1,
        user_id: 'users:0',
        timezone: 'Europe/Paris',
    }],
    user_role: [
        { id: 1, user_id: 'users:0', role_id: 'roles:0', created_by: 'users:0' },
        { id: 2, user_id: 'users:1', role_id: 'roles:1', created_by: 'users:0' },
        { id: 3, user_id: 'users:2', role_id: 'roles:2', created_by: 'users:0' },
    ],
    roles: [
        { id: 1, name: 'Admin' },
        { id: 2, name: 'Manager' },
        { id: 3, name: 'Employee' },
    ],
    user_properties: [
        {
            user_id: 'users:0',
            name: 'firebaseToken',
            value: '"eQW4odWupNAHqmgTnzQIqf::APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HHmQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ"',
        },
        {
            user_id: 'users:1',
            name: 'firebaseToken',
            value: '"eQW4odWupNAHqmgTnzQIqf::APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HHmQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ"',
        },
        {
            user_id: 'users:2',
            name: 'firebaseToken',
            value: '"eQW4odWupNAHqmgTnzQIqf::APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HHmQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ"',
        },
        {
            user_id: 'users:3',
            name: 'firebaseToken',
            value: '"eQW4odWupNAHqmgTnzQIqf::APA91bEDy9TRuKn_fPhPbesbkt7gteJgNQUq3MDVFi5afw19HHmQJzzrHQsYAFdtHIaIxaAj3T6-BS8OZrKzW5WDfFNe8f062POOpK-YMirMXwImB-Ayhzh-LoU9ZeEyoqM4rW6vg1KJ"',
        },
    ],
    users: [
        {
            id: 1,
            first_name: 'Bob',
            last_name: 'Admin',
            email: 'admin@example.com',
            password: '02fa170dc79172995399331a203f0cfc::88ede3a7abcea3c3a3c5b3a4905613df',
            status: 1,
        },
        {
            id: 2,
            first_name: 'Bob',
            last_name: 'Organizer',
            email: 'organizer@example.com',
            password: '02fa170dc79172995399331a203f0cfc::88ede3a7abcea3c3a3c5b3a4905613df',
            status: 1,
        },
        {
            id: 3,
            first_name: 'Bob',
            last_name: 'Employee1',
            email: 'employee1@example.com',
            password: '02fa170dc79172995399331a203f0cfc::88ede3a7abcea3c3a3c5b3a4905613df',
            status: 1,
        },
        {
            id: 4,
            first_name: 'Bob',
            last_name: 'Employee2',
            email: 'employee2@example.com',
            password: '02fa170dc79172995399331a203f0cfc::88ede3a7abcea3c3a3c5b3a4905613df',
            status: 1,
        },
    ],
};

class MySqlFixtures {
    async load() {
        // for (let table in dataSpec) {
        //     await MySql.query('DELETE FROM ??;', [table]);
        // }
        return sqlFixtures.create(dbConfig, dataSpec);
    }
}

module.exports = new MySqlFixtures();