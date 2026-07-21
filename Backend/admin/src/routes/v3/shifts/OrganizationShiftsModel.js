const moment = require('moment-timezone');
const { BaseModel } = require('../../../models/BaseModel');
const Organization = require('../../../routes/v3/organization');

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const setDateTime = (date, time, timezone) => {
    const [hours, minutes] = time.split(':');
    return moment.tz(date.toISOString().substr(0, 10), timezone).set({ hours, minutes, seconds: 0, milliseconds: 0 }).utc();
};

const isEndInNextDay = (start, end) => {
    const [startHours, startMinutes] = start.split(':');
    const [endHours, endMinutes] = end.split(':');
    const startInMin = +startHours * 60 + +startMinutes;
    const endInMin = +endHours * 60 + +endMinutes;
    return startInMin > endInMin;
}

class OrganizationShiftsModel extends BaseModel {
    static get TABLE_NAME() {
        return 'organization_shifts';
    }

    static get TABLE_FIELDS() {
        return [
            'id',
            'organization_id',
            'name',
            'data',
            'location_id',
            'notes',
            'created_by',
            'updated_by',
            'created_at',
            'updated_at',
            'color_code',
            'late_period',
            'early_login_logout_time',
            'half_day_hours',
            'overtime_period',
            'productivity_halfday',
            'productivity_present',
        ];
    }

    static create(values) {
        values.updated_by = values.created_by;
        return super.create(values);
    }


    static async count(organization_id) {
        const query = 'SELECT COUNT(id) AS count FROM ?? WHERE ?? = ?';
        return await this.query(query, [this.TABLE_NAME, 'organization_id', organization_id]);
    }

    get organization() {
        if (this._organization) return Promise.resolve(this._organization);
        return Organization.OrganizationModel.get(this.organization_id).then((organization) => {
            organization._shift = this;
            this._organization = organization;
            return organization;
        });
    }

    async timesByDate(date, shiftTimezone) {
        const day = DAYS[date.getDay()];
        const shift = JSON.parse(this.data)[day];
        if (!shiftTimezone) {
            const organization = await this.organization;
            shiftTimezone = organization.timezone;
        }
        if (!shift || !shift.status) {
            return Promise.resolve({});
        }
        let endDate = date;
        if (isEndInNextDay(shift.time.start, shift.time.end)) {
            endDate = moment(date, "YYYY-MM-DD").add(1, 'day');
        }
        return Promise.resolve({
            start: setDateTime(date, shift.time.start, shiftTimezone),
            end: setDateTime(endDate, shift.time.end, shiftTimezone),
        });
    }

    static async getByName(name, organization_id, id) {
        return await this.query(
            `SELECT id, name FROM ?? WHERE ?? = ? and ?? = ? AND ?? != ?`,
            [this.TABLE_NAME, 'name', name, 'organization_id', organization_id, 'id', id],
        );
    }
}

module.exports.OrganizationShiftsModel = OrganizationShiftsModel;
module.exports.DAYS = DAYS;
