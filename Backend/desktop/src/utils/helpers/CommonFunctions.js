"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment-timezone');


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

class Common {

    /**
     * Parse String Date into DateTime Format.
     *
     * @param timeStamp with "15-Mar-2004 12:58:14" Format.
     * @returns DateTime in moment("2004-03-15T12:58:14.402") Format.
     * @default false
     */
    formatDateTime(timeStamp) {
        let hours = new Date(timeStamp).getHours();
        let minutes = new Date(timeStamp).getMinutes();
        let seconds = new Date(timeStamp).getSeconds();
        let dates = new Date(timeStamp).getDate();
        let months = new Date(timeStamp).getMonth();
        let years = new Date(timeStamp).getFullYear();

        return (moment().set({
            hours, minutes, seconds, dates, months, years
        }))
    }

    removeSpclChars(str) {
        return str.replace(/[^a-zA-Z0-9-_]/g, ' ')
        // return str.replace(/[\n\r\t]/g)
        // return str.replace(/\W_/g, "")
        // return str.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '')
        // return str.replace(/[^\w\s]/gi, '')
    }

    timeStringToSec(timeStr) {
        return +(timeStr.split(':').reduce((acc, time) => (60 * acc) + +time));
    }

    extractHostname(url) {
        var hostname;
        //find & remove protocol (http, ftp, etc.) and get hostname

        if (url.indexOf("//") > -1) {
            hostname = url.split('/')[2];
        }
        else {
            hostname = url.split('/')[0];
        }

        //find & remove port number
        hostname = hostname.split(':')[0];
        //find & remove "?"
        hostname = hostname.split('?')[0];

        return hostname;
    }

    toUtcDateTime(inputDateTime, timezone) {
        let myDate = moment(inputDateTime);
        let userLocalDate = moment().tz(timezone).set({
            date: myDate.get('date'),
            month: myDate.get('month'),
            year: myDate.get('year'),
            hour: myDate.get('hour'),
            minute: myDate.get('minute'),
            second: myDate.get('second')
        });
        return userLocalDate.utc().format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * @returns Date Validator in YYYY-MM-DD Format.
     */
    dateValidator(field) {
        return Joi
            .string()
            .regex(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/)
            .messages({
                "string.base": `"${field}" should be a type of 'text'`,
                "string.pattern.base": `"${field}" must be in YYYY-MM-DD format`,
                "string.empty": `"${field}" cannot be an empty field`,
                "any.required": `"${field}" is a required field`
            })
    }

    /**
     * @returns DateTime Validator in YYYY-MM-DD HH:mm:ss Format.
     */
    dateTimeValidator(field) {
        return Joi
            .string()
            .regex(/^([0-2][0-9]{3})\-(0[1-9]|1[0-2])\-([0-2][0-9]|3[0-1]) ([0-1][0-9]|2[0-3]):([0-5][0-9])\:([0-5][0-9])( ([\-\+]([0-1][0-9])\:00))?$/)
            .messages({
                "string.base": `"${field}" should be a type of 'text'`,
                "string.pattern.base": `"${field}" must be in YYYY-MM-DD HH:mm:ss format`,
                "string.empty": `"${field}" cannot be an empty field`,
                "any.required": `"${field}" is a required field`
            })
    }

    timesByDate = async (data, date, timezone) => {
        date = new Date(date)
        const day = DAYS[date.getDay()];
        const shift = data[day];

        if (!shift || !shift.status) {
            return Promise.resolve({});
        }
        let endDate = date;
        if (isEndInNextDay(shift.time.start, shift.time.end)) {
            endDate = moment(date, "YYYY-MM-DD").add(1, 'day');
        }

        return Promise.resolve({
            start: setDateTime(date, shift.time.start, timezone),
            end: setDateTime(endDate, shift.time.end, timezone),
        });
    }

    // let lat1 = 12.934001, lon1 = 77.618640, lat2 = 12.934189, lon2 = 77.618533
    twolocationDiff({ lat1, lon1, lat2, lon2 }) {
        const radlat1 = Math.PI * lat1 / 180;
        const radlat2 = Math.PI * lat2 / 180;
        const theta = lon1 - lon2;
        const radtheta = Math.PI * theta / 180;
        let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) dist = 1;

        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;
        return {
            kilometre: dist * 1.609344,
            metres: (dist * 1.609344) * 1000,
            nauticalmiles: dist * 0.8684
        };
    }

    getTime = (expire) => {
        console.log('=========', expire)
        if (expire.charAt(expire.length - 1) == 'h') {
            const time = +expire.substring(0, expire.lastIndexOf("h"));
            return time * (60 * 60);
        } else if (expire.charAt(expire.length - 1) == 'd') {
            const time = +expire.substring(0, expire.lastIndexOf("d"));
            return time * (24 * 60 * 60);
        } else {
            return (24 * 60 * 60);
        }
    }

    hapijoiStringErrorMessage = (errors) => {
        return errors.map(error => {
            switch (error.code) {
                case "string.pattern.invert.base":
                    error.message = `${error.local.key} not allowed with these '/[<>;]/' special characters`
                    break;
                case "any.required":
                    error.message = `${error.local.key} required`
                    break;
                case "string.max":
                    error.message = `${error.local.key} length must be less than or equal to ${error.local.limit} characters long `
                    break;
                default:
                    error.message = ` invalid ${error.local.key}`;
                    break;
            }
            return error
        });
    }

}

module.exports = new Common;