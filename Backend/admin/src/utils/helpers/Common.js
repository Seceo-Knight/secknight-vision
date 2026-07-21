"use strict";

const Joi = require('@hapi/joi');
const joi = require('joi');
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
        try {
            let x = inputDateTime.split('-');
            let myDate;
            if (inputDateTime.includes("sc")) {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
            } else {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5].replace('.jpg', '')}`);
            }
            let userLocalDate = myDate.tz(timezone).set({
                date: myDate.get('date'),
                month: myDate.get('month'),
                year: myDate.get('year'),
                hour: myDate.get('hour'),
                minute: myDate.get('minute'),
                second: myDate.get('second')
            });
            if (inputDateTime.includes("sc")) {
                return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD HH:mm:ss')}-${x[6]}`;
            } else {
                return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD HH:mm:ss')}.jpg`;
            }
        } catch (error) {
            return inputDateTime;
        }

    }

    _parseUserLocalDateSR(inputDateTime, timezone) {
        const x = inputDateTime.split('-');
        const myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5].replace('.mp4', '')}`);

        return myDate.tz(timezone).set({
            date: myDate.get('date'),
            month: myDate.get('month'),
            year: myDate.get('year'),
            hour: myDate.get('hour'),
            minute: myDate.get('minute'),
            second: myDate.get('second')
        });
    }

    toTimezoneDateofSR(inputDateTime, timezone) {
        try {
            const userLocalDate = this._parseUserLocalDateSR(inputDateTime, timezone);

            return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD HH:mm:ss')}.mp4`;
        } catch (error) {
            return inputDateTime;
        }

    }

    toTimezoneDateofSS_Timeslot(inputDateTime, timezone) {
        try {
            let x = inputDateTime.split('-');
            let myDate;
            if (x.includes("sc")) {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
            } else {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5].replace('.jpg', '')}`);
            }

            let userLocalDate = myDate.tz(timezone).set({
                date: myDate.get('date'),
                month: myDate.get('month'),
                year: myDate.get('year'),
                hour: myDate.get('hour'),
                minute: myDate.get('minute'),
                second: myDate.get('second')
            });

            return `${userLocalDate.format('HH')}`;
        } catch (error) {
            return inputDateTime;
        }

    }

    toTimezoneDateofSR_Timeslot(inputDateTime, timezone) {
        try {
            const userLocalDate = this._parseUserLocalDateSR(inputDateTime, timezone);

            return `${userLocalDate.format('HH')}`;
        } catch (error) {
            return inputDateTime;
        }

    }

    toTimezoneDateofSSutc(inputDateTime, timezone) {
        try {
            let x = inputDateTime.split('-');
            let myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
            let userLocalDate = myDate.tz(timezone).set({
                date: myDate.get('date'),
                month: myDate.get('month'),
                year: myDate.get('year'),
                hour: myDate.get('hour'),
                minute: myDate.get('minute'),
                second: myDate.get('second')
            });
            return `${moment(userLocalDate).utc().get('hour')}-${userLocalDate.utc().format('YYYY-MM-DD HH:mm:ss')}-${x[6]}`;
        } catch (error) {
            return inputDateTime;
        }

    }

    toTimezoneDateofSSTimeWithDate(inputDateTime, timezone) {
        try {
            let x = inputDateTime.split('-');
            let myDate;
            if (inputDateTime.includes("sc")) {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
            } else {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5].replace('.jpg', '')}`);
            }
            let userLocalDate = myDate.tz(timezone).set({
                date: myDate.get('date'),
                month: myDate.get('month'),
                year: myDate.get('year'),
                hour: myDate.get('hour'),
                minute: myDate.get('minute'),
                second: myDate.get('second')
            });
            if (inputDateTime.includes("sc")) {
                return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD')}`;
            } else {
                return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD')}`;
            }
        } catch (error) {
            return inputDateTime;
        }
    }


    toTimezoneDateofSRTimeWithDate(inputDateTime, timezone) {
        try {
            const userLocalDate = this._parseUserLocalDateSR(inputDateTime, timezone);

            return `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD')}`;
        } catch (error) {
            return inputDateTime;
        }

    }

    toTimezoneDateFormat(inputDateTime, timezone, type) {
        try {
            let x = inputDateTime.split('-'), myDate, response;
            if (inputDateTime.includes("sc")) {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5]}`);
            } 
            else if (inputDateTime.includes("mp4")) {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5].replace('.mp4', '')}`);
            }
            else {
                myDate = moment.utc(`${x[1]}-${x[2]}-${x[3].split(' ')[0]} ${x[3].split(' ')[1]}:${x[4]}:${x[5].replace('.jpg', '')}`);
            }
            let userLocalDate = moment.tz(myDate, 'YYYY-MM-DD HH:mm:ss', timezone);
            switch (String(type)) {
                case 'time':
                    if (inputDateTime.includes("sc")) {
                        response = `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD HH:mm:ss')}-${x[6]}`;
                    } else {
                        response = `${moment(userLocalDate).get('hour')}-${userLocalDate.format('YYYY-MM-DD HH:mm:ss')}.jpg`;
                    }
                    break;
                case 'utc':
                    response = `${moment(userLocalDate).utc().get('hour')}-${userLocalDate.utc().format('YYYY-MM-DD HH:mm:ss')}-${x[6]}`;
                    break;
                case 'timeSlot':
                    response = `${userLocalDate.format('HH')}`;
                    break;
                default: break;
            }
            return response;
        } catch (error) {
            return inputDateTime;
        }


    }

    hourToSeconds(hours) {
        const data = hours.split(":");
        return ((+data[0] * 3600) + (+data[1] * 60));
    }

    joiErrorMessage = (errors, language = "en") => {

        return errors.map(error => {
            let messageData = [
                {
                    id: 1,
                    "en": `${error.context.key} not allowed with these '/[$\(\)<>]/' special characters`,
                    "es": `${error.context.key} no permitido con estos caracteres especiales '/[$\(\)<>]/'`,
                    "idn": `${error.context.key} tidak diizinkan dengan karakter khusus '/[$\(\)<>]/' ini`,
                    "ar": `${error.context.key} غير مسموح به مع هذه الأحرف الخاصة '/ [$ \ (\) <>] /'`,
                    "fr": `${error.context.key} non autorisé avec ces caractères spéciaux '/[$\(\)<>]/'`
                },
                {
                    id: 2,
                    "en": `${error.context.key} required`,
                    "es": `${error.context.key} requerida`,
                    "idn": `${error.context.key} diperlukan`,
                    "ar": `${error.context.key} مطلوب`,
                    "fr": `${error.context.key} requis`,
                },
                {
                    id: 3,
                    "en": `${error.context.key} length must be at least ${error.context.limit} characters long `,
                    "es": `${error.context.key} la longitud debe tener al menos ${error.context.limit} caracteres`,
                    "idn": `${error.context.key} panjangnya harus minimal ${error.context.limit} karakter`,
                    "ar": `${error.context.key} يجب ألا يقل الطول عن ${error.context.limit} أحرف`,
                    "fr": `${error.context.key} la longueur doit être d'au moins ${error.context.limit} caractères`,
                },
                {
                    id: 4,
                    "en": `${error.context.key} length must be less than or equal to ${error.context.limit} characters long `,
                    "es": `${error.context.key} la longitud debe ser menor o igual a ${error.context.limit} caracteres`,
                    "idn": `${error.context.key} panjangnya harus kurang dari atau sama dengan ${error.context.limit} karakter`,
                    "ar": `${error.context.key} يجب أن يكون الطول أقل من أو يساوي ${error.context.limit} أحرف`,
                    "fr": `${error.context.key} la longueur doit être inférieure ou égale à ${error.context.limit} caractères`,
                },
                {
                    id: 5,
                    "en": `${error.context.key} must be one of [${error.context.valids}]`,
                    "es": `${error.context.key} debe ser uno de [${error.context.valids}]`,
                    "idn": `${error.context.key} harus menjadi salah satu [${error.context.valids}]`,
                    "ar": `${error.context.key} يجب أن يكون واحدًا من [${error.context.valids}]`,
                    "fr": `${error.context.key} doit être l'un des [${error.context.valids}]`,
                },
                {
                    id: 6,
                    "en": ` invalid ${error.context.key}`,
                    "es": `inválida ${error.context.key}`,
                    "idn": `tidak sah ${error.context.key}`,
                    "ar": `غير صالح ${error.context.key}`,
                    "fr": `invalide ${error.context.key}`,
                },
            ]
            switch (error.type) {
                case "string.regex.invert.base":
                    return { message: messageData[0][language || 'en'] };
                case "any.required":
                    return { message: messageData[1][language || 'en'] };
                case "string.min":
                    return { message: messageData[2][language || 'en'] };
                case "string.max":
                    return { message: messageData[3][language || 'en'] }
                case "any.allowOnly":
                    return { message: messageData[4][language || 'en'] }
                default:
                    return { message: messageData[5][language || 'en'] };
            }
        });

    }

    joiArrayStringErrorMessage = (errors) => {
        return errors.map(error => {
            switch (error.type) {
                case "string.regex.invert.base":
                    return { message: `${error.path[0]} not allowed with these '/[$\(\)<>]/' special characters` };
                case "any.required":
                    return { message: `${error.path[0]} required` };
                case "string.min":
                    return { message: `${error.path[0]} length must be at least ${error.context.limit} characters long ` };
                case "string.max":
                    return { message: `${error.path[0]} length must be less than or equal to ${error.context.limit} characters long ` }
                case "any.allowOnly":
                    return { message: `${error.path[0]} must be one of [${error.context.valids}]` }
                default:
                    return { message: ` invalid ${error.path[0]}` };
            }
        });

    }

    hapijoiStringErrorMessage = (errors) => {
        return errors.map(error => {
            switch (error.code) {
                case "string.pattern.invert.base":
                    error.message = `${error.local.key} not allowed with these '/[$\(\)<>]/' special characters`
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

    setDateTime = (date, time, timezone) => {
        const [hours, minutes] = time.split(':');
        return moment.tz(date.toISOString().substr(0, 10), timezone).set({ hours, minutes, seconds: 0, milliseconds: 0 }).utc();
    };

    isEndInNextDay = (start, end) => {
        const [startHours, startMinutes] = start.split(':');
        const [endHours, endMinutes] = end.split(':');
        const startInMin = +startHours * 60 + +startMinutes;
        const endInMin = +endHours * 60 + +endMinutes;
        return startInMin > endInMin;
    }

    getTime = (expire) => {
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
}

module.exports = new Common;