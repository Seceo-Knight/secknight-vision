"use strict";

const Joi = require('@hapi/joi');
const moment = require('moment-timezone');

class Common {

    removeSpclChars(str) {
        return str.replace(/[^a-zA-Z0-9-_]/g, ' ')
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

        if ('www.com' !== hostname) {
            hostname = hostname.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
            hostname = hostname.trim();
        }
        return hostname;
    }

    urlValidator() {
        return Joi
            .string()
            // .regex(/:\/\/[0-9a-z-.]+\.[a-z]+\//i)
            // .messages({ "string.pattern.base": `"url" must have tld` })
            .uri({
                scheme: [
                    /https?/,
                ],
            });
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
     * Converts YYYYMMDD Number to YYYY-MM-DD String
     *
     * @param {Number} yyyymmdd
     * @returns {String}
     * @memberof Common
     */
    yyyymmdd_to_yyyy_mm_dd(yyyymmdd) {
        return yyyymmdd.toString().replace(/(\d{4})(\d{2})(\d{2})/g, '$1-$2-$3');
    }

    /**
     * @returns Date Validator in YYYY-MM-DD Format.
     */
    dateValidator(field) {
        return Joi.string().regex(/^\d{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])$/).messages({
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

    toTimezoneDateofSS(inputDateTime, timezone) {
        let x = inputDateTime.split('-');
        let myDate = moment(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
        let userLocalDate = myDate.tz(timezone).set({
            date: myDate.get('date'),
            month: myDate.get('month'),
            year: myDate.get('year'),
            hour: myDate.get('hour'),
            minute: myDate.get('minute'),
            second: myDate.get('second')
        });
        return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD HH:mm:ss')}-${x[6]}`;
    }

    toTimezoneDateofSS_Timeslot(inputDateTime, timezone) {
        let x = inputDateTime.split('-');
        let myDate = moment(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
        let userLocalDate = myDate.tz(timezone).set({
            date: myDate.get('date'),
            month: myDate.get('month'),
            year: myDate.get('year'),
            hour: myDate.get('hour'),
            minute: myDate.get('minute'),
            second: myDate.get('second')
        });
        return `${userLocalDate.format('HH')}`;
    }

    toTimezoneDateofSSutc(inputDateTime, timezone) {
        let x = inputDateTime.split('-');
        let myDate = moment(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
        let userLocalDate = myDate.tz(timezone).set({
            date: myDate.get('date'),
            month: myDate.get('month'),
            year: myDate.get('year'),
            hour: myDate.get('hour'),
            minute: myDate.get('minute'),
            second: myDate.get('second')
        });
        return `${moment(userLocalDate).utc().get('hour')}-${userLocalDate.utc().format('YYYY-MM-DD HH:mm:ss')}-${x[6]}`;
    }

    formateUrl = (url) => {
        url = url.toLowerCase();
        url = url.replace(new RegExp(/^\s+/), "");
        url = url.replace(new RegExp(/\s+$/), "");
        url = url.replace(new RegExp(/^http\:\/\/|^https\:\/\/|^ftp\:\/\//i), "");
        url = url.replace(new RegExp(/^www\./i), "");
        url = url.split('?')[0];
        return url;
    }
}

module.exports = new Common;