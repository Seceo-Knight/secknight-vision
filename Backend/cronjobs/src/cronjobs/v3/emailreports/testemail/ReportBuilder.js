const temp = require('temp');
const uniqid = require('uniqid');
const rimraf = require('rimraf');
const moment = require('moment-timezone');
const _ = require("underscore");

const archiver = require('archiver');
// const archiver = require('archiver');
var fs = require('fs');
// const getSize = require('get-folder-size');
const path = require('path');
const graph = require('../../../../GraphExtension/barGraph');

const { reportsModel } = require('./reports.model');
const OrgAppWebModel = require('../../models/organization_apps_web.schema');
const { createObjectCsvWriter } = require('csv-writer');
const { Mailer } = require('../../../../messages/Mailer');
// const jobs = require('../../../../../jobs');
const EmailTemplate = require('./email.template');
const SilahEmailTemplate = require('./silahemail.template');
// const { logger: Logger } = require('../../../../../loggers/Logger');
const { csvEmailReportHeaders, emailFileName, autoEmailContent, autoEmailpdfgraphtext } = require('../../../../utils/helpers/LanguageTranslation');
const { PdfMaker } = require('../pdf-maker/pdf-maker.js');
const UserActivityModel = require('../../checkScreensAge/checkScreensAge.model')
// const CloudStorageServices = require('../../../useractivity/service/cloudstorageServices/index');
// const CloudStorageServices = require('./utils/index');
const CloudStorageServices = require('../../checkScreensAge/utils/index');

const { logger: Logger } = require('../../../../utils/Logger');

const htmlTemplate = require("../attendance/htmlTemplate");
const attendanceReport = require("../attendance/attendance.controller");
const hrmsAttendanceReport = require("../attendance/hrmsAttendance/hrmsAttendance.controller");

const util = require('util');

const config = require("../../../../../../config/config")
const getMetaData = require('metadata-scraper')

const maskingIP = require("../../../../utils/helpers/IPMasking");
const datesRange = (timezone, [offset, unit], startWeekMonday) => {
    return [
        moment().tz(timezone).subtract(offset, unit).startOf(startWeekMonday ? 'isoWeek' : unit).format('YYYY-MM-DD'),
        moment().tz(timezone).subtract(offset, unit).endOf(startWeekMonday ? 'isoWeek' : unit).format('YYYY-MM-DD'),
    ];
};

const toTimezoneDate = (inputDateTime, timezone) => {
    let myDate = moment(inputDateTime);
    let userLocalDate = myDate.tz(timezone).set({
        date: myDate.get('date'),
        month: myDate.get('month'),
        year: myDate.get('year'),
        hour: myDate.get('hour'),
        minute: myDate.get('minute'),
        second: myDate.get('second')
    });
    return userLocalDate.format('YYYY-MM-DD HH:mm:ss');
};

const capitalize = (str) => {
    return str.toLowerCase().split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const appsToHtml = (apps, language = 'en') => {
    return (apps && apps.length > 0) ?
        apps.reduce(function (acc, app) {
            return `${acc}<li>${capitalize(app.name)} - ${secondsToHhmmss(app.duration)} hr</li>`;
        }, '')
        : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'];
};

const formatTemplate = ({ topApps, topWebs, prod, subject, reportDate, previousProd, empStat, totalDays, frequency, orgProductiveHours, language, resellerData, reportLink, orgId, template, timesheetHtmlTable }) => {
    try {
        let officeTime;
        let computerTime;
        let productivity;
        let prevProductivity;
        let nonProductivity;
        let comparedToPrevious;
        let neutral;
        let idle;
        /** NOTE: comment below to make email comment localize */
        // language = 'en'; // <----- this line
        /** localized strings */
        let haveAnyQuestionStr = autoEmailContent.find(x => x.id === "17")[language] || autoEmailContent.find(x => x.id === "17")['en'];
        let helpCenterStr = autoEmailContent.find(x => x.id === "18")[language] || autoEmailContent.find(x => x.id === "18")['en'];
        let unsubsribeMessageStr = autoEmailContent.find(x => x.id === "19")[language] || autoEmailContent.find(x => x.id === "19")['en'];
        let unsubsribeStr = autoEmailContent.find(x => x.id === "20")[language] || autoEmailContent.find(x => x.id === "20")['en'];
        let findMoreStr = autoEmailContent.find(x => x.id === "21")[language] || autoEmailContent.find(x => x.id === "21")['en'];
        let reportStr = autoEmailContent.find(x => x.id === "22")[language] || autoEmailContent.find(x => x.id === "22")['en'];
        let reportDateStr = autoEmailContent.find(x => x.id === "23")[language] || autoEmailContent.find(x => x.id === "23")['en'];
        let sellerMailChangesObj = {
            hasLogo: false,
            /** sellter contact */
            facebookLink: process.env.FACEBOOK,
            instagramLink: process.env.INSTAGRAM,
            twitterLink: process.env.TWITTER,
            /** seller logo */
            logoLink: "",
            /** copyright */
            copyrightName: process.env.BRAND_NAME,
            copyrightYear: process.env.COPYRIGHT_YEAR,
            /** support */
            supportMail: "",
            supportText: "",
            supportMailStr: "Support Mail",
            /** seller admin */
            skypeEmail: "",
            skypeMailStr: "Skype Mail",
            helpLink: process.env.HELP_LINK
        };
        let findMoreLink = {
            development: process.env.WEB_DEV, production: process.env.WEB_PRODUCTION
        }[process.env.NODE_ENV] || process.env.WEB_LOCAL;

        if (resellerData) {
            const resellerDetailsObj = resellerData.details && resellerData.details.length ? JSON.parse(resellerData.details) : null;
            if (resellerDetailsObj) {

                /** sellter contact */
                sellerMailChangesObj.facebookLink = getResellerData(resellerDetailsObj, 'facebook');
                sellerMailChangesObj.instagramLink = getResellerData(resellerDetailsObj, 'instagram');
                sellerMailChangesObj.twitterLink = getResellerData(resellerDetailsObj, 'twitter');

                /** seller logo */
                sellerMailChangesObj.hasLogo = getResellerData(resellerData, 'logo') ? true : sellerMailChangesObj.logoLink;
                sellerMailChangesObj.logoLink = getResellerData(resellerData, 'logo');

                /** copyright */
                sellerMailChangesObj.copyrightName = getResellerData(resellerDetailsObj, 'copyright_name') || getResellerData(resellerDetailsObj, 'brand_name');
                sellerMailChangesObj.copyrightYear = getResellerData(resellerDetailsObj, 'copyright_year') || sellerMailChangesObj.copyrightYear;

                /** support */
                sellerMailChangesObj.supportMail = getResellerData(resellerDetailsObj, "support_mail");
                // sellerMailChangesObj.supportText = getResellerData(resellerDetailsObj, 'support_text');

                /** seller admin */
                sellerMailChangesObj.skypeEmail = getResellerData(resellerDetailsObj, 'skype_email');
                sellerMailChangesObj.helpLink = getResellerData(resellerDetailsObj, "help_link");
                sellerMailChangesObj.supportMailStr = autoEmailContent.find(x => x.id === "24")[language] || autoEmailContent.find(x => x.id === "24")['en'];
                sellerMailChangesObj.skypeMailStr = autoEmailContent.find(x => x.id === "25")[language] || autoEmailContent.find(x => x.id === "25")['en'];

                /** find more link */
                findMoreLink = getResellerData(resellerDetailsObj, 'domain');
            }
        }
        if (prod && prod.length > 0) {
            computerTime = prod[0].productive_duration + prod[0].non_productive_duration + prod[0].neutral_duration;
            officeTime = computerTime + prod[0].break_duration + prod[0].idle_duration;
            if (process.env.ORGANIZATION_ID.split(',').includes(prod[0]._id.toString())) {
                productivity = isNaN(prod[0].productive_duration / (30600 * prod[0].count)) ? 0 : ((prod[0].productive_duration / (30600 * prod[0].count)) * 100).toFixed(2);
                nonProductivity = isNaN(prod[0].non_productive_duration / 30600 * prod[0].count) ? 0 : ((prod[0].non_productive_duration / (30600 * prod[0].count)) * 100).toFixed(2);
                neutral = isNaN(prod[0].neutral_duration / 30600 * prod[0].count) ? 0 : ((prod[0].neutral_duration / (30600 * prod[0].count)) * 100).toFixed(2);
                idle = isNaN(prod[0].idle_duration / 30600 * prod[0].count) ? 0 : ((prod[0].idle_duration / (30600 * prod[0].count)) * 100).toFixed(2);
            } else if (orgProductiveHours !== 0) {
                productivity = isNaN(prod[0].productive_duration / (orgProductiveHours * prod[0].count)) ? 0 : ((prod[0].productive_duration / (orgProductiveHours * prod[0].count)) * 100).toFixed(2);
                nonProductivity = isNaN(prod[0].non_productive_duration / (orgProductiveHours * prod[0].count)) ? 0 : ((prod[0].non_productive_duration / (orgProductiveHours * prod[0].count)) * 100).toFixed(2);
                neutral = isNaN(prod[0].neutral_duration / (orgProductiveHours * prod[0].count)) ? 0 : ((prod[0].neutral_duration / (orgProductiveHours * prod[0].count)) * 100).toFixed(2);
                idle = isNaN(prod[0].idle_duration / (orgProductiveHours * prod[0].count)) ? 0 : ((prod[0].idle_duration / (orgProductiveHours * prod[0].count)) * 100).toFixed(2);
            } else {
                productivity = isNaN(prod[0].productive_duration / officeTime) ? 0 : ((prod[0].productive_duration / officeTime) * 100).toFixed(2);
                nonProductivity = isNaN(prod[0].non_productive_duration / officeTime) ? 0 : ((prod[0].non_productive_duration / officeTime) * 100).toFixed(2);
                neutral = isNaN(prod[0].neutral_duration / officeTime) ? 0 : ((prod[0].neutral_duration / officeTime) * 100).toFixed(2);
                idle = isNaN(prod[0].idle_duration / officeTime) ? 0 : ((prod[0].idle_duration / officeTime) * 100).toFixed(2);
            }
            if (config?.cappingProductivityOrgs.split(',').includes(orgId.toString())) {
                if (+(productivity) > 100) productivity = 100;
                if (+(nonProductivity) > 100) nonProductivity = 100;
                if (+(neutral) > 100) neutral = 100;
                if (+(idle) > 100) idle = 100;
            }
        }
        if (previousProd && previousProd.length > 0) {
            let prevComputerTime = previousProd[0].productive_duration + previousProd[0].non_productive_duration + previousProd[0].neutral_duration;
            let prevOfficeTime = prevComputerTime + previousProd[0].break_duration + previousProd[0].idle_duration
            if (process.env.ORGANIZATION_ID.split(',').includes(previousProd[0]._id.toString())) {
                prevProductivity = isNaN(previousProd[0].productive_duration / (30600 * previousProd[0].count)) ? 0 : ((previousProd[0].productive_duration / (30600 * previousProd[0].count)) * 100).toFixed(2);
            } else {
                prevProductivity = isNaN(previousProd[0].productive_duration / prevOfficeTime) ? 0 : ((previousProd[0].productive_duration / prevOfficeTime) * 100).toFixed(2);
            }
        }
        if (previousProd && previousProd.length > 0 && prod && prod.length > 0) {
            comparedToPrevious = (productivity - prevProductivity).toFixed(2);
        } else {
            comparedToPrevious = autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'];
        }
        if (config?.cappingProductivityOrgs.split(',').includes(orgId.toString())) {
            if (+(comparedToPrevious) < -100) comparedToPrevious = -100;
            if (+(comparedToPrevious) > 100) comparedToPrevious = 100;
        }
        const timeAndAttendance = ((empStat[0].present_count / (empStat[0].total_count * totalDays)) * 100).toFixed(2);
        if (template.customMailSilah) return SilahEmailTemplate.emailTemplate({
                officeTime: (prod.length > 0) ? `${secondsToHhmmss(officeTime)} hr` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                computerActivity: (prod.length > 0) ? `${secondsToHhmmss(computerTime)} hr` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                productiveHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].productive_duration)} hr (${productivity}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                nonProductiveHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].non_productive_duration)} hr (${nonProductivity}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                neutralHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].neutral_duration)} hr (${neutral}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                idleHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].idle_duration)} hr (${idle}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                productivityPer: (prod.length > 0) ? `${productivity} %` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                comparedToPrevious: (previousProd.length > 0 && prod.length > 0) ? `${comparedToPrevious} %` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
                topWebSites: appsToHtml(topWebs, language),
                topApps: appsToHtml(topApps, language),
                findMoreLink,
                heading: `${subject}`,
                reportDate: reportDate,
                timeAttendances: `${timeAndAttendance} %`,
                frequency: [
                    '',
                    autoEmailContent.find(x => x.id === "14")[language] || autoEmailContent.find(x => x.id === "14")['en'],
                    autoEmailContent.find(x => x.id === "15")[language] || autoEmailContent.find(x => x.id === "15")['en'],
                    autoEmailContent.find(x => x.id === "16")[language] || autoEmailContent.find(x => x.id === "16")['en'],
                    autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en']
                ][+frequency],
                officeTimeStr: autoEmailContent.find(x => x.id === "1")[language] || autoEmailContent.find(x => x.id === "1")['en'],
                productivityPerStr: autoEmailContent.find(x => x.id === "2")[language] || autoEmailContent.find(x => x.id === "2")['en'],
                computerActivityStr: autoEmailContent.find(x => x.id === "3")[language] || autoEmailContent.find(x => x.id === "3")['en'],
                comparedToPreviousStr: autoEmailContent.find(x => x.id === "4")[language] || autoEmailContent.find(x => x.id === "4")['en'],
                timeAttendancesStr: autoEmailContent.find(x => x.id === "5")[language] || autoEmailContent.find(x => x.id === "5")['en'],
                productiveHourStr: autoEmailContent.find(x => x.id === "6")[language] || autoEmailContent.find(x => x.id === "6")['en'],
                nonProductiveHourStr: autoEmailContent.find(x => x.id === "7")[language] || autoEmailContent.find(x => x.id === "7")['en'],
                neutralHourStr: autoEmailContent.find(x => x.id === "8")[language] || autoEmailContent.find(x => x.id === "8")['en'],
                idleHourStr: autoEmailContent.find(x => x.id === "9")[language] || autoEmailContent.find(x => x.id === "9")['en'],
                topAppAndWebStr: autoEmailContent.find(x => x.id === "10")[language] || autoEmailContent.find(x => x.id === "10")['en'],
                topAppsStr: autoEmailContent.find(x => x.id === "11")[language] || autoEmailContent.find(x => x.id === "11")['en'],
                topWebSitesStr: autoEmailContent.find(x => x.id === "12")[language] || autoEmailContent.find(x => x.id === "12")['en'],
                haveAnyQuestionStr: autoEmailContent.find(x => x.id === "17")[language] || autoEmailContent.find(x => x.id === "17")['en'],
                helpCenterStr: autoEmailContent.find(x => x.id === "18")[language] || autoEmailContent.find(x => x.id === "18")['en'],
                findMoreStr, haveAnyQuestionStr, helpCenterStr, unsubsribeMessageStr, unsubsribeStr, reportStr,
                reportDateStr, sellerMailChangesObj,
                reportLink,
                timesheetHtmlTable
            });
        return EmailTemplate.emailTemplate({
            officeTime: (prod.length > 0) ? `${secondsToHhmmss(officeTime)} hr` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            computerActivity: (prod.length > 0) ? `${secondsToHhmmss(computerTime)} hr` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            productiveHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].productive_duration)} hr (${productivity}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            nonProductiveHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].non_productive_duration)} hr (${nonProductivity}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            neutralHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].neutral_duration)} hr (${neutral}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            idleHour: (prod.length > 0) ? `${secondsToHhmmss(prod[0].idle_duration)} hr (${idle}%)` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            productivityPer: (prod.length > 0) ? `${productivity} %` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            comparedToPrevious: (previousProd.length > 0 && prod.length > 0) ? `${comparedToPrevious} %` : autoEmailContent.find(x => x.id === "13")[language] || autoEmailContent.find(x => x.id === "13")['en'],
            topWebSites: appsToHtml(topWebs, language),
            topApps: appsToHtml(topApps, language),
            findMoreLink,
            heading: `${subject}`,
            reportDate: reportDate,
            timeAttendances: `${timeAndAttendance} %`,
            frequency: [
                '',
                autoEmailContent.find(x => x.id === "14")[language] || autoEmailContent.find(x => x.id === "14")['en'],
                autoEmailContent.find(x => x.id === "15")[language] || autoEmailContent.find(x => x.id === "15")['en'],
                autoEmailContent.find(x => x.id === "16")[language] || autoEmailContent.find(x => x.id === "16")['en'],
                autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en'],
                autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en'],
                autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en'],
                autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en'],
                autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en'],
                autoEmailContent.find(x => x.id === "26")[language] || autoEmailContent.find(x => x.id === "26")['en'],
            ][+frequency],
            officeTimeStr: autoEmailContent.find(x => x.id === "1")[language] || autoEmailContent.find(x => x.id === "1")['en'],
            productivityPerStr: autoEmailContent.find(x => x.id === "2")[language] || autoEmailContent.find(x => x.id === "2")['en'],
            computerActivityStr: autoEmailContent.find(x => x.id === "3")[language] || autoEmailContent.find(x => x.id === "3")['en'],
            comparedToPreviousStr: autoEmailContent.find(x => x.id === "4")[language] || autoEmailContent.find(x => x.id === "4")['en'],
            timeAttendancesStr: autoEmailContent.find(x => x.id === "5")[language] || autoEmailContent.find(x => x.id === "5")['en'],
            productiveHourStr: autoEmailContent.find(x => x.id === "6")[language] || autoEmailContent.find(x => x.id === "6")['en'],
            nonProductiveHourStr: autoEmailContent.find(x => x.id === "7")[language] || autoEmailContent.find(x => x.id === "7")['en'],
            neutralHourStr: autoEmailContent.find(x => x.id === "8")[language] || autoEmailContent.find(x => x.id === "8")['en'],
            idleHourStr: autoEmailContent.find(x => x.id === "9")[language] || autoEmailContent.find(x => x.id === "9")['en'],
            topAppAndWebStr: autoEmailContent.find(x => x.id === "10")[language] || autoEmailContent.find(x => x.id === "10")['en'],
            topAppsStr: autoEmailContent.find(x => x.id === "11")[language] || autoEmailContent.find(x => x.id === "11")['en'],
            topWebSitesStr: autoEmailContent.find(x => x.id === "12")[language] || autoEmailContent.find(x => x.id === "12")['en'],
            haveAnyQuestionStr: autoEmailContent.find(x => x.id === "17")[language] || autoEmailContent.find(x => x.id === "17")['en'],
            helpCenterStr: autoEmailContent.find(x => x.id === "18")[language] || autoEmailContent.find(x => x.id === "18")['en'],
            findMoreStr, haveAnyQuestionStr, helpCenterStr, unsubsribeMessageStr, unsubsribeStr, reportStr,
            reportDateStr, sellerMailChangesObj,
            reportLink,
            timesheetHtmlTable
        });
    } catch (err) {
        console.log(err);
        return Promise.reject(err);
    }
};

const secondsToHhmmss = (seconds) => {
    let hh = ~~(seconds / 3600);
    let mm = ~~((seconds % 3600) / 60);
    let ss = seconds % 60;

    if (hh < 10) hh = `0${hh}`;
    if (mm < 10) mm = `0${mm}`;
    if (ss < 10) ss = `0${ss}`;

    return `${hh}:${mm}:${ss}`;
};

const secondsToMmss = (seconds) => {
    let mm = ~~((seconds) / 60);
    let ss = seconds % 60;

    if (mm < 10) mm = `0${mm}`;
    if (ss < 10) ss = `0${ss}`;

    return `${mm}:${ss}`;
};

const convertToPositiveMinute = (time, type) => {
    if (type == "secondsToMmss") return time < 0 ? `- ${secondsToMmss(Math.abs(time))}` : secondsToMmss(time);
    if (type == "secondsToHhmmss") return time < 0 ? `- ${secondsToHhmmss(Math.abs(time))}` : secondsToHhmmss(time);
}

const prodStatus = { '0': 'Neutral', '1': "Productive", '2': "Unproductive" }


class ReportBuilder {
    constructor({ timezone, name, orgId, empIds, depIds, frequency, content, recipients, orgProductiveHours, language, resellerData, reportTypes, custom, filterType, customMailSilah }) {
        this.arguments = { timezone, name, orgId, empIds, depIds, frequency, content, recipients, orgProductiveHours, language, resellerData, reportTypes, custom, filterType, customMailSilah };
        Object.assign(this, this.arguments);
    }

    getCvsWriter(fileName, header) {
        const filePath = `${this.dirName}/${fileName}`;
        const csvWriter = createObjectCsvWriter({ path: filePath, header });
        return { filePath, csvWriter };
    };

    /**
     * getPdfFilePath 
     * @memberof ReportBuilder
     * @description function to get the Pdf file path
     * @returns String
     * @author Amit Verma <amitverma@globussoft.in>
     */
    getPdfFilePath(fileName) {
        return `${this.dirName}/${fileName}`;
    }

    async getAttendances() {
        try {
            if (this._attandances) return Promise.resolve(this._attandances);
            const { orgId, empIds, startDate, endDate, depIds } = this;
            const attendances = await reportsModel.getAttendanceUsingFilter({
                orgId, empIds, startDate, endDate, depIds,
            });
            this._attandances = {};
            for (const attendance of attendances) {
                this._attandances[attendance.attendance_id] = attendance;
            }
            return this._attandances;
        } catch (err) {
            console.log('--------------', err);
            return Promise.reject(err);
        }
    }

    async getLoginAttendances({ loginStartDate, loginEndDate }) {
        try {
            const { orgId, empIds, depIds } = this;
            this.attendances = await reportsModel.getAttendanceUsingTimeSlot({
                orgId, empIds, depIds, loginStartDate, loginEndDate,
            });

            return this.attendances;
        } catch (err) {
            console.log('------------', err)
            return Promise.reject(err);
        }
    }

    async getAttandanceIdsGroupped() {
        try {
            const { orgId, empIds, startDate, endDate, depIds } = this;
            const attendances = await reportsModel.getAttandanceIdsGroupped({
                orgId, empIds, startDate, endDate, depIds,
            });
            return attendances;
        } catch (err) {
            console.log('------------', err)
            return Promise.reject(err);
        }
    }

    async getApplications() {
        try {
            if (this._applications) return Promise.resolve(this._applications);
            this._applications = {};
            for await (const application of OrgAppWebModel.find({ organization_id: this.orgId }, { name: 1 }).lean()) {
                this._applications[application._id] = application.name;
            }
            return this._applications;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    async getApplicationsUsedOrg(applicationIds) {
        try {
            // if (this._applications) return Promise.resolve(this._applications);
            this._applications = {};
            for await (const application of OrgAppWebModel.find({ organization_id: this.orgId, _id: { $in: applicationIds }, }, { name: 1 }).lean()) {
                this._applications[application._id] = application.name;
            }
            return this._applications;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    async getEmployees() {
        try {
            if (this._employees) return Promise.resolve(this._employees);
            const { orgId } = this;
            this._employees = {};
            const employees = await reportsModel.getEmployeesData({ orgId });
            for await (const employee of employees) {
                this._employees[employee.id] = employee;
            }
            return this._employees;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    /**
        * getProductivityOfEmp 
        * @description function to get productivity of employee
        * @memberof ReportBuilder
        * @param {Object} 
        * @returns Object
        * @author Guru prasad <guruprasad@globussoft.in>
        */
    async getProductivityOfEmp({ orgId, empIds, startDate, endDate, depIds }) {
        if (this._ProductivityOfEmp) return this._ProductivityOfEmp;
        this._ProductivityOfEmp = await reportsModel.getProductivityOfEmp({ orgId, empIds, startDate, endDate, depIds })
        if(config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
            this._ProductivityOfEmp = this._ProductivityOfEmp.sort((a, b) => {
                return a.id - b.id;
            });
        }
        return this._ProductivityOfEmp
    }

    /**
      * getProductivity 
      * @description function to get productivity of employee
      * @memberof ReportBuilder
      * @param {Object} 
      * @returns Object
      * @author Guru prasad <guruprasad@globussoft.in>
      */
    async getProductivity({ orgId, empIds, startDate, endDate, depIds }) {
        if (this._Productivity) return this._Productivity;
        this._Productivity = await reportsModel.getProductivity({ orgId, empIds, startDate, endDate, depIds })
        return this._Productivity
    }

    /**
     * getConsolatedAppUsed 
     * @description function to get the app used consolated data
     * @memberof ReportBuilder
     * @param {Object} 
     * @returns Object
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getConsolatedAppUsed({ orgId, empIds, startDate, endDate, depIds, type }) {
        if (this._consolatedAppUsed) return this._consolatedAppUsed;
        this._consolatedAppUsed = await reportsModel.consolatedAppWebUsed({ orgId, empIds, startDate, endDate, depIds, type, filterType: this.filterType });
        if(config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
            if(this._consolatedAppUsed.length > 0 && this._consolatedAppUsed[0]?.employee_id) {
                this._consolatedAppUsed = this._consolatedAppUsed.sort((a, b) => {
                    return a.employee_id - b.employee_id;
                });
            }
        }
        return this._consolatedAppUsed
    }

    /**
     * getConsolatedWebUsed 
     * @description function to get the browser used consolated data
     * @memberof ReportBuilder
     * @param {Object} 
     * @returns Object
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getConsolatedWebUsed({ orgId, empIds, startDate, endDate, depIds, type }) {
        if (this._consolatedWebUsed) return this._consolatedWebUsed;
        this._consolatedWebUsed = await reportsModel.consolatedAppWebUsed({ orgId, empIds, startDate, endDate, depIds, type, filterType: this.filterType });
        if(config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
            if(this._consolatedWebUsed.length > 0 && this._consolatedWebUsed[0]?.employee_id) {
                this._consolatedWebUsed = this._consolatedWebUsed.sort((a, b) => {
                    return a.employee_id - b.employee_id;
                });
            }
        }
        return this._consolatedWebUsed
    }

    /**
     * getAppApplicationsStatus 
     * @description function to get the app status
     * @memberof ReportBuilder
     * @param {Object} 
     * @returns Object
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getAppApplicationsStatus(applicationIds, params = []) {
        if (this._appApplicationsStatus) return this._appApplicationsStatus;
        this._appApplicationsStatus = await reportsModel.getApplicationsStatus(applicationIds, params);
        return this._appApplicationsStatus
    }

    /**
     * getWebApplicationsStatus 
     * @description function to get the browser app status
     * @memberof ReportBuilder
     * @param {Object} 
     * @returns Object
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getWebApplicationsStatus(applicationIds, params = []) {
        if (this._webApplicationsStatus) return this._webApplicationsStatus;
        this._webApplicationsStatus = await reportsModel.getApplicationsStatus(applicationIds, params);
        return this._webApplicationsStatus
    }

    async timeSheet(fileName) {
        try {
            const timeType = this.content.timesheetInMinutes == 1 ? '(min)' : '(hr)';
            const csvReportHeader = csvEmailReportHeaders.timesheet[this.language] || csvEmailReportHeaders.timesheet['en'];
            const ipMaskingOrgId = process.env.IP_MASKING_ORG_ID ? process.env.IP_MASKING_ORG_ID.split(",") : null;
            const condition = ipMaskingOrgId && ipMaskingOrgId.includes(this.orgId.toString()) ? false : true;
            const workingHoursOrgId = process.env.WORKING_HOURS_ORG_ID ? process.env.WORKING_HOURS_ORG_ID.split(",") : null;
            const workingHoursCondition = workingHoursOrgId && workingHoursOrgId.includes(this.orgId.toString()) ? true : false;
            const wastedHoursCondition = config.WASTED_HOURS_ORG_ID.split(",").includes(this.orgId.toString()) ? true : false;
            let csvFileHeader = [
                { id: 'name', title: csvReportHeader.name },
                { id: 'email', title: csvReportHeader.email },
                { id: 'emp_code', title: csvReportHeader.emp_code },
                { id: 'location_name', title: csvReportHeader.location_name },
                { id: 'department_name', title: csvReportHeader.department_name },
                { id: 'computer_name', title: csvReportHeader.computer_name },
                { id: 'date', title: csvReportHeader.date },
                { id: wastedHoursCondition ? "day" : '', title: wastedHoursCondition ? `Day`: "" },
                { id: 'start_time', title: csvReportHeader.start_time },
                { id: 'end_time', title: csvReportHeader.end_time },
                { id: "start_hour", "title": csvReportHeader.start_hour },
                { id: "end_hours", "title": csvReportHeader.end_hours },
                { id: 'total_time', title: `${csvReportHeader.total_time}${timeType}` },
                { id: 'office_time', title: `${csvReportHeader.office_time}${timeType}` },
                { id: 'active_time', title: `${csvReportHeader.active_time}${timeType}` },
                { id: 'idle_duration', title: `${csvReportHeader.idle_duration}${timeType}` },
                { id: 'productive_duration', title: `${csvReportHeader.productive_duration}${timeType}` },
                { id: 'non_productive_duration', title: `${csvReportHeader.non_productive_duration}${timeType}` },
                { id: 'neutral_duration', title: `${csvReportHeader.neutral_duration}${timeType}` },
                { id: 'offline_duration', title: `${csvReportHeader.offline_duration}${timeType}` },
                { id: condition ? 'checkin_ip' : '', title: condition ? csvReportHeader.checkin_ip : '' },
                { id: wastedHoursCondition ? 'hours_wasted' : '', title: wastedHoursCondition ? csvReportHeader.hours_wasted : '' },
                { id: workingHoursCondition ? "working_hours" : '', title: workingHoursCondition ? `${csvReportHeader.working_hours}` : "" },
                { id: workingHoursCondition ? "working_hours_percentage" : '', title: workingHoursCondition ? `${csvReportHeader.working_hours} %` : "" },
            ].filter(x => x.id != '');

            let allowedCustomClientHeader = config.AUTO_EMAIL_REPORT_SELECTED_HEADER[this.orgId];
            if(allowedCustomClientHeader && allowedCustomClientHeader?.timesheet?.length > 0) {
                csvFileHeader = csvFileHeader.filter(x => allowedCustomClientHeader?.timesheet?.includes(x.id));
                if(allowedCustomClientHeader?.timesheet?.includes('prod')) csvFileHeader.push({ id: 'prod', title: csvReportHeader.prod });
            }

            this.TIMESHEET_HEADER_REPORT = csvFileHeader;

            const { filePath, csvWriter } = this.getCvsWriter(fileName, csvFileHeader);
            const { orgId, empIds, startDate, endDate, depIds, orgProductiveHours } = this;
            const [attendances, productivity] = await Promise.all([
                this.getAttendances(),
                this._Productivity ? this._Productivity : this.getProductivity({ orgId, empIds, startDate, endDate, depIds }),
            ]);
            const productivityByEmpIdAndDate = {};
            for (const entity of productivity) {
                productivityByEmpIdAndDate[`${entity.employee_id}${entity.date}`] = entity;
            }
            await csvWriter.writeRecords([]);
            let attendancesArr = Object.values(attendances);
            if (config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
                attendancesArr = attendancesArr.sort((a, b) => a.id - b.id);
            }
            for (const attendance of attendancesArr) {
                const {
                    productive_duration = 0,
                    non_productive_duration = 0,
                    neutral_duration = 0,
                    idle_duration = 0,
                    break_duration = 0,
                } = productivityByEmpIdAndDate[`${attendance.id}${moment(attendance.date).format('YYYY-MM-DD')}`] || {};

                const office_time = productive_duration + non_productive_duration + neutral_duration + idle_duration + break_duration;
                const active_time = productive_duration + non_productive_duration + neutral_duration;
                const total_time = Math.round((new Date(attendance.end_time).getTime() - new Date(attendance.start_time).getTime()) / 1000);

                const workingHours = office_time - 28800;
                let workingHoursPercentage = (active_time/28800)*100;
                workingHoursPercentage = Math.round(workingHoursPercentage * 100) / 100;
                let hoursWasted = (idle_duration + (total_time - office_time)) - config.LUNCH_DURATION;
                if(hoursWasted < 0 ) hoursWasted = 0;

                let prod = (productive_duration / orgProductiveHours  * 100 ).toFixed(2);

                let record = {
                    name: attendance.name,
                    email: attendance.email,
                    emp_code: attendance.emp_code,
                    date: `${moment(attendance.date).format('YYYY-MM-DD')}`,
                    day: `${moment(attendance.date).format('dddd')}`,
                    start_time: toTimezoneDate(attendance.start_time, attendance.timezone),
                    end_time: toTimezoneDate(attendance.end_time, attendance.timezone),
                    "start_hour": moment(toTimezoneDate(attendance.start_time, attendance.timezone)).format('HH:mm:ss'),
                    "end_hours": moment(toTimezoneDate(attendance.end_time, attendance.timezone)).format('HH:mm:ss'),
                    total_time: this.content.timesheetInMinutes == 1 ? secondsToMmss(total_time) : secondsToHhmmss(total_time),
                    office_time: this.content.timesheetInMinutes == 1 ? secondsToMmss(office_time) : secondsToHhmmss(office_time),
                    active_time: this.content.timesheetInMinutes == 1 ? secondsToMmss(active_time) : secondsToHhmmss(active_time),
                    productive_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(productive_duration) : secondsToHhmmss(productive_duration),
                    non_productive_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(non_productive_duration) : secondsToHhmmss(non_productive_duration),
                    neutral_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(neutral_duration) : secondsToHhmmss(neutral_duration),
                    idle_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(idle_duration) : secondsToHhmmss(idle_duration),
                    department_name: attendance.department_name,
                    location_name: attendance.location_name,
                    computer_name: attendance.computer_name,
                    offline_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(total_time - office_time) : secondsToHhmmss(total_time - office_time),
                    checkin_ip: attendance.details ? JSON.parse(attendance.details).checkInIp : null,
                    working_hours: this.content.timesheetInMinutes == 1 ? convertToPositiveMinute(workingHours,"secondsToMmss") : convertToPositiveMinute(workingHours,"secondsToHhmmss"),
                    working_hours_percentage: workingHoursPercentage,
                    hours_wasted: this.content.timesheetInMinutes == 1  ?  secondsToMmss(hoursWasted) : secondsToHhmmss(hoursWasted),
                    prod,
                };

                if (this.TIMESHEET_HEADER_REPORT_DATA && this.TIMESHEET_HEADER_REPORT_DATA.length) {
                    this.TIMESHEET_HEADER_REPORT_DATA.push(record);
                } else {
                    this.TIMESHEET_HEADER_REPORT_DATA = [record];
                }

                await csvWriter.writeRecords([record]);
            }
            return filePath;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    /**
     * timeSheetPdf
     * @memberof ReportBuilder
     * @description function to create a PDF file for timesheet report
     * @param { String } fileName
     * @returns { Promise | String }
     * @author Amit Verma <amitverma@globussoft.in>
     */
     async timeSheetPdf(fileName, customMailSilah) {
        try {
            const timeType = this.content.timesheetInMinutes == 1 ? '(min)' : '(hr)';
            const pdfReportHeader = csvEmailReportHeaders.timesheet[this.language] || csvEmailReportHeaders.timesheet['en'];
            const filePath = this.getPdfFilePath(fileName);
            const ipMaskingOrgId = process.env.IP_MASKING_ORG_ID ? process.env.IP_MASKING_ORG_ID.split(",") : null;
            const condition = ipMaskingOrgId && ipMaskingOrgId.includes(this.orgId.toString()) ? false : true;
            const workingHoursOrgId = process.env.WORKING_HOURS_ORG_ID ? process.env.WORKING_HOURS_ORG_ID.split(",") : null;
            const workingHoursCondition = workingHoursOrgId && workingHoursOrgId.includes(this.orgId.toString()) ? true : false;
            let pdfFileTableHeader = [
                { id: 'name', title: pdfReportHeader.name },
                { id: 'email', title: pdfReportHeader.email },
                { id: 'emp_code', title: pdfReportHeader.emp_code },
                { id: 'location_name', title: pdfReportHeader.location_name },
                { id: 'department_name', title: pdfReportHeader.department_name },
                { id: 'computer_name', title: pdfReportHeader.computer_name },
                { id: 'date', title: pdfReportHeader.date },
                { id: 'start_time', title: pdfReportHeader.start_time },
                { id: 'end_time', title: pdfReportHeader.end_time },
                { id: "start_hour", "title": pdfReportHeader.start_hour },
                { id: "end_hours", "title": pdfReportHeader.end_hours },
                { id: 'total_time', title: `${pdfReportHeader.total_time}${timeType}` },
                { id: 'office_time', title: `${pdfReportHeader.office_time}${timeType}` },
                { id: 'active_time', title: `${pdfReportHeader.active_time}${timeType}` },
                { id: 'idle_duration', title: `${pdfReportHeader.idle_duration}${timeType}` },
                { id: 'productive_duration', title: `${pdfReportHeader.productive_duration}${timeType}` },
                { id: 'non_productive_duration', title: `${pdfReportHeader.non_productive_duration}${timeType}` },
                { id: 'neutral_duration', title: `${pdfReportHeader.neutral_duration}${timeType}` },
                { id: 'offline_duration', title: `${pdfReportHeader.offline_duration}${timeType}` },
            ].filter(x => x.id != '');

            let allowedCustomClientHeader = config.AUTO_EMAIL_REPORT_SELECTED_HEADER[this.orgId];
            if(allowedCustomClientHeader && allowedCustomClientHeader?.timesheet?.length > 0) {
                pdfFileTableHeader = pdfFileTableHeader.filter(x => allowedCustomClientHeader?.timesheet?.includes(x.id));
                if(allowedCustomClientHeader?.timesheet?.includes('prod')) pdfFileTableHeader.push({ id: 'prod', title: pdfReportHeader.prod });
            }

            if (condition) pdfFileTableHeader.push({ id: 'checkin_ip', title: pdfReportHeader.checkin_ip });
            if (workingHoursCondition) pdfFileTableHeader.push({id: "working_hours", title: `${pdfReportHeader.working_hours}`});
            if (workingHoursCondition) pdfFileTableHeader.push({id: "working_hours_percentage", title: `${pdfReportHeader.working_hours} %`});
            
            this.TIMESHEET_HEADER_REPORT = pdfFileTableHeader;
        
            // Check if TIMESHEET_HEADER_REPORT_DATA was already populated by CSV method
            const dataAlreadyPopulated = this.TIMESHEET_HEADER_REPORT_DATA && this.TIMESHEET_HEADER_REPORT_DATA.length > 0;

            // adding reseller logo link
            let pdfFileLogoUrl = process.env.EMPLOGO;
            if (this.resellerData) {
                if (this.resellerData.logo && this.resellerData.logo !== 'null') pdfFileLogoUrl = this.resellerData.logo;
            }

            const pdfDoc = new PdfMaker({ filepath: filePath, customMailSilah }).createPdfDoc();
            pdfDoc.setFont(this.language);
            pdfDoc.setDocDetails([
                `${emailFileName.find(x => x.id === "3")[this.language] || emailFileName.find(x => x.id === "3")['en']}`.split('_').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' '),
                `Date: ${this.reportDate}`
            ]);
            await pdfDoc.setLogo(pdfFileLogoUrl);
            pdfDoc.setTableHeaders(pdfFileTableHeader);

            let pdfTableRowData = [];

            const { orgId, empIds, startDate, endDate, depIds, orgProductiveHours } = this;
            const [attendances, productivity] = await Promise.all([
                this.getAttendances(),
                this._Productivity ? this._Productivity : this.getProductivity({ orgId, empIds, startDate, endDate, depIds }),
            ]);
            const productivityByEmpIdAndDate = {};
            for (const entity of productivity) {
                productivityByEmpIdAndDate[`${entity.employee_id}${entity.date}`] = entity;
            }

            // blank entry
            pdfTableRowData.push({});

            let attendancesArr = Object.values(attendances);
            if (config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
                attendancesArr = attendancesArr.sort((a, b) => a.id - b.id);
            }
            for (const attendance of attendancesArr) {
                const {
                    productive_duration = 0,
                    non_productive_duration = 0,
                    neutral_duration = 0,
                    idle_duration = 0,
                    break_duration = 0,
                } = productivityByEmpIdAndDate[`${attendance.id}${moment(attendance.date).format('YYYY-MM-DD')}`] || {};

                const office_time = productive_duration + non_productive_duration + neutral_duration + idle_duration + break_duration;
                const active_time = productive_duration + non_productive_duration + neutral_duration;
                const total_time = Math.round((new Date(attendance.end_time).getTime() - new Date(attendance.start_time).getTime()) / 1000);

                const workingHours = office_time - 28800;
                let workingHoursPercentage = (active_time/28800)*100;
                workingHoursPercentage = Math.round(workingHoursPercentage * 100) / 100;

                let prod = (productive_duration / orgProductiveHours  * 100 ).toFixed(2);

                let record = {
                    name: attendance.name,
                    email: attendance.email,
                    emp_code: attendance.emp_code,
                    date: `${moment(attendance.date).format('YYYY-MM-DD')}`,
                    start_time: toTimezoneDate(attendance.start_time, attendance.timezone),
                    end_time: toTimezoneDate(attendance.end_time, attendance.timezone),
                    "start_hour": moment(toTimezoneDate(attendance.start_time, attendance.timezone)).format('HH:mm:ss'),
                    "end_hours": moment(toTimezoneDate(attendance.end_time, attendance.timezone)).format('HH:mm:ss'),
                    total_time: this.content.timesheetInMinutes == 1 ? secondsToMmss(total_time) : secondsToHhmmss(total_time),
                    office_time: this.content.timesheetInMinutes == 1 ? secondsToMmss(office_time) : secondsToHhmmss(office_time),
                    active_time: this.content.timesheetInMinutes == 1 ? secondsToMmss(active_time) : secondsToHhmmss(active_time),
                    productive_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(productive_duration) : secondsToHhmmss(productive_duration),
                    non_productive_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(non_productive_duration) : secondsToHhmmss(non_productive_duration),
                    neutral_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(neutral_duration) : secondsToHhmmss(neutral_duration),
                    idle_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(idle_duration) : secondsToHhmmss(idle_duration),
                    department_name: attendance.department_name,
                    location_name: attendance.location_name,
                    computer_name: attendance.computer_name,
                    offline_duration: this.content.timesheetInMinutes == 1 ? secondsToMmss(total_time - office_time) : secondsToHhmmss(total_time - office_time),
                    checkin_ip: attendance.details ? JSON.parse(attendance.details).checkInIp : null,
                    working_hours: this.content.timesheetInMinutes == 1 ? convertToPositiveMinute(workingHours,"secondsToMmss") : convertToPositiveMinute(workingHours,"secondsToHhmmss"),
                    working_hours_percentage: workingHoursPercentage,
                    prod,
                }

                // Only populate TIMESHEET_HEADER_REPORT_DATA if it wasn't already populated by CSV method
                if (!dataAlreadyPopulated) {
                    if (this.TIMESHEET_HEADER_REPORT_DATA && this.TIMESHEET_HEADER_REPORT_DATA.length) {
                        this.TIMESHEET_HEADER_REPORT_DATA.push(record);
                    } else {
                        this.TIMESHEET_HEADER_REPORT_DATA = [record];
                    }
                }

                pdfTableRowData.push(record);
            }

            //TODO: logic to create the PDF file
            await pdfDoc.setTableBody(pdfTableRowData).end();
            return filePath;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    async productivity(fileName) {
        try {
            const csvReportHeader = csvEmailReportHeaders.productivity[this.language] || csvEmailReportHeaders.productivity['en'];
            const OFFICE_TIME_ORGANIZATION_ID = process.env.OFFICE_TIME_ORGANIZATION_ID?.split(",")?.includes(String(this.orgId));
            const displayOfficeTime = OFFICE_TIME_ORGANIZATION_ID && this.frequency == 3 ? true : false;
            const autoEmailWeeklySortingProductivityReport = config.AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS.includes(+this.orgId);
            if (autoEmailWeeklySortingProductivityReport) displayOfficeTime = true;
            let csvFileHeader = [
                { id: 'name', title: csvReportHeader.name },
                { id: 'emp_code', title: csvReportHeader.emp_code },
                { id: 'location', title: csvReportHeader.location },
                { id: 'department', title: csvReportHeader.department },
                { id: 'computer_name', title: csvReportHeader.computer_name },
                { id: 'computer_time', title: `${csvReportHeader.computer_time}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                autoEmailWeeklySortingProductivityReport ? { id: 'idle_hours', title: csvReportHeader.idle_hours } : { id: '', title: '' },
                autoEmailWeeklySortingProductivityReport ? { id: 'offline_hours', title: csvReportHeader.offline_hours } : { id: '', title: '' },
                { id: 'productive_duration', title: `${csvReportHeader.productive_duration}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'prod', title: csvReportHeader.prod },
                { id: 'non_productive_duration', title: `${csvReportHeader.non_productive_duration}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'nonprod', title: csvReportHeader.nonprod },
                { id: 'neutral_duration', title: `${csvReportHeader.neutral_duration}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'present_days', title: csvReportHeader.present_days },
                displayOfficeTime ? { id: 'office_hours', title: csvReportHeader.office_hours } : { id: '', title: '' }
            ].filter(x => x.id != '');
            const { filePath, csvWriter } = this.getCvsWriter(fileName, csvFileHeader);
            const { orgId, empIds, startDate, endDate, depIds, orgProductiveHours } = this;
            const employees = await this.getEmployees();
            await csvWriter.writeRecords([]);
            let productivityData = await this.getProductivityOfEmp({ orgId, empIds, startDate, endDate, depIds })

            for (const productivity of productivityData) {
                const employee = employees[productivity._id];
                if (!employee) continue;
                let prod = (process.env.ORGANIZATION_ID.split(',').includes(this.orgId.toString())) ?
                    (isNaN((productivity.productive_duration / (30600 * productivity.count))) ? 0 :
                        ((productivity.productive_duration / (30600 * productivity.count)) * 100).toFixed(2)) :
                    (orgProductiveHours != 0 ? (isNaN((productivity.productive_duration / (orgProductiveHours * productivity.count))) ? 0 :
                        ((productivity.productive_duration / (orgProductiveHours * productivity.count)) * 100).toFixed(2)) :
                        (isNaN((productivity.productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration))) ? 0 :
                            ((productivity.productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration)) * 100).toFixed(2)));

                let nonprod = (process.env.ORGANIZATION_ID.split(',').includes(this.orgId.toString())) ?
                    (isNaN((productivity.non_productive_duration / (30600 * productivity.count))) ? 0 :
                        ((productivity.non_productive_duration / (30600 * productivity.count)) * 100).toFixed(2)) :
                    (
                        orgProductiveHours != 0 ? (isNaN((productivity.non_productive_duration / (orgProductiveHours * productivity.count))) ? 0 :
                            ((productivity.non_productive_duration / (orgProductiveHours * productivity.count)) * 100).toFixed(2)) :
                            (isNaN((productivity.non_productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration))) ? 0 :
                                ((productivity.non_productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration)) * 100).toFixed(2)));

                if (config?.cappingProductivityOrgs.split(',').includes(orgId.toString())) {
                    if (+(prod) > 100) prod = 100;
                    if (+(nonprod) > 100) nonprod = 100;
                }
                
                await csvWriter.writeRecords([{
                    name: employee.name,
                    emp_code: employee.emp_code,
                    computer_time: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.computer_time) : secondsToHhmmss(productivity.computer_time),
                    productive_duration: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.productive_duration) : secondsToHhmmss(productivity.productive_duration),
                    neutral_duration: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.neutral_duration) : secondsToHhmmss(productivity.neutral_duration),
                    non_productive_duration: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.non_productive_duration) : secondsToHhmmss(productivity.non_productive_duration),
                    department: employee.department,
                    location: employee.location,
                    prod: `${prod} %`,
                    nonprod: `${nonprod} %`,
                    computer_name: employee.computer_name,
                    present_days: productivity.count,
                    office_hours: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.office_hours) : secondsToHhmmss(productivity.office_hours),
                    idle_hours: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.idle_duration) : secondsToHhmmss(productivity.idle_duration),
                    offline_hours: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.office_hours - productivity.computer_time) : secondsToHhmmss(productivity.office_hours - productivity.computer_time),
                }]);
            }
            return filePath;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    /**
     * productivityPdf
     * @memberof ReportBuilder
     * @description generate a PDF report for productivity
     * @param { String } fileName
     * @return { Promise | String }
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async productivityPdf(fileName, customMailSilah) {
        try {
            const pdfReportHeader = csvEmailReportHeaders.productivity[this.language] || csvEmailReportHeaders.productivity['en'];
            const filePath = this.getPdfFilePath(fileName);
            const OFFICE_TIME_ORGANIZATION_ID = process.env.OFFICE_TIME_ORGANIZATION_ID?.split(",")?.includes(String(this.orgId));
            const displayOfficeTime = OFFICE_TIME_ORGANIZATION_ID && this.frequency == 3 ? true : false;
            let pdfFileTableHeader = [
                { id: 'name', title: pdfReportHeader.name },
                { id: 'emp_code', title: pdfReportHeader.emp_code },
                { id: 'location', title: pdfReportHeader.location },
                { id: 'department', title: pdfReportHeader.department },
                { id: 'computer_name', title: pdfReportHeader.computer_name },
                { id: 'computer_time', title: `${pdfReportHeader.computer_time}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'productive_duration', title: `${pdfReportHeader.productive_duration}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'prod', title: pdfReportHeader.prod },
                { id: 'non_productive_duration', title: `${pdfReportHeader.non_productive_duration}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'nonprod', title: pdfReportHeader.nonprod },
                { id: 'neutral_duration', title: `${pdfReportHeader.neutral_duration}(${this.content.prodInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'present_days', title: pdfReportHeader.present_days }
            ];
            if (displayOfficeTime) pdfFileTableHeader.push({ id: 'office_hours', title: pdfReportHeader.office_hours });
            const pdfTableRowData = [];
            // adding reseller logo link
            let pdfFileLogoUrl = process.env.EMPLOGO;
            if (this.resellerData) {
                if (this.resellerData.logo && this.resellerData.logo !== 'null') pdfFileLogoUrl = this.resellerData.logo;
            }

            const pdfDoc = new PdfMaker({ filepath: filePath, customMailSilah }).createPdfDoc();
            pdfDoc.setFont(this.language);
            pdfDoc.setDocDetails([
                `${emailFileName.find(x => x.id === "4")[this.language] || emailFileName.find(x => x.id === "4")['en']}_${autoEmailContent.find(x => x.id === "22")[this.language] || autoEmailContent.find(x => x.id === "22")['en']}`.split('_').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' '),
                `Date: ${this.reportDate}`
            ]);
            await pdfDoc.setLogo(pdfFileLogoUrl);
            pdfDoc.setTableHeaders(pdfFileTableHeader);

            const { orgId, empIds, startDate, endDate, depIds, orgProductiveHours } = this;
            const employees = await this.getEmployees();

            //  blank entry
            pdfTableRowData.push({});
            let productivityData = await this.getProductivityOfEmp({ orgId, empIds, startDate, endDate, depIds })

            for (const productivity of productivityData) {
                const employee = employees[productivity._id];
                if (!employee) continue;
                let prod = (process.env.ORGANIZATION_ID.split(',').includes(this.orgId.toString())) ?
                    (isNaN((productivity.productive_duration / (30600 * productivity.count))) ? 0 :
                        ((productivity.productive_duration / (30600 * productivity.count)) * 100).toFixed(2)) :
                    (orgProductiveHours != 0 ? (isNaN((productivity.productive_duration / (orgProductiveHours * productivity.count))) ? 0 :
                        ((productivity.productive_duration / (orgProductiveHours * productivity.count)) * 100).toFixed(2)) :
                        (isNaN((productivity.productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration))) ? 0 :
                            ((productivity.productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration)) * 100).toFixed(2)));

                let nonprod = (process.env.ORGANIZATION_ID.split(',').includes(this.orgId.toString())) ?
                    (isNaN((productivity.non_productive_duration / (30600 * productivity.count))) ? 0 :
                        ((productivity.non_productive_duration / (30600 * productivity.count)) * 100).toFixed(2)) :
                    (
                        orgProductiveHours != 0 ? (isNaN((productivity.non_productive_duration / (orgProductiveHours * productivity.count))) ? 0 :
                            ((productivity.non_productive_duration / (orgProductiveHours * productivity.count)) * 100).toFixed(2)) :
                            (isNaN((productivity.non_productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration))) ? 0 :
                                ((productivity.non_productive_duration / (productivity.computer_time + productivity.idle_duration + productivity.break_duration)) * 100).toFixed(2)));

                if (config?.cappingProductivityOrgs.split(',').includes(orgId.toString())) {
                    if (+(prod) > 100) prod = 100;
                    if (+(nonprod) > 100) nonprod = 100;
                }
                
                pdfTableRowData.push({
                    name: employee.name,
                    emp_code: employee.emp_code,
                    computer_time: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.computer_time) : secondsToHhmmss(productivity.computer_time),
                    productive_duration: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.productive_duration) : secondsToHhmmss(productivity.productive_duration),
                    neutral_duration: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.neutral_duration) : secondsToHhmmss(productivity.neutral_duration),
                    non_productive_duration: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.non_productive_duration) : secondsToHhmmss(productivity.non_productive_duration),
                    department: employee.department,
                    location: employee.location,
                    prod: `${prod} %`,
                    nonprod: `${nonprod} %`,
                    computer_name: employee.computer_name,
                    present_days: productivity.count,
                    office_hours: this.content.prodInMinutes == 1 ? secondsToMmss(productivity.office_hours) : secondsToHhmmss(productivity.office_hours)
                });
            }
            // generate the pdf file
            await pdfDoc.setTableBody(pdfTableRowData).end();
            return filePath;
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    async appUsage(fileName) {
        try {
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'name', title: 'Employee name' },
                { id: 'department', title: 'Department' },
                { id: 'location', title: 'Location' },
                { id: 'emp_code', title: 'Employee Code' },
                { id: 'date', title: 'Date' },
                { id: 'start_time', title: 'Start time' },
                { id: 'end_time', title: 'End time' },
                { id: 'total_duration', title: 'Total duration' },
                { id: 'active_duration', title: 'Active duration' },
                { id: 'idle_duration', title: 'Idle duration' },
                { id: 'app_name', title: 'Application name' },
                { id: 'status', title: 'Productivity Ranking' },
            ]);
            const attendances = await this.getAttendances();
            const attendanceIds = Object.keys(attendances).map(id => +id);
            const applications = await this.getApplications();
            let applicationIds = Object.keys(applications)
            const attendanceData = Object.values(attendances)
            let departmentIds = _.pluck(attendanceData, "department_id")
            departmentIds = _.unique(departmentIds);
            const statuses = await reportsModel.getApplicationsStatus(applicationIds, departmentIds);
            await csvWriter.writeRecords([]);
            await reportsModel.getApplicationsUsedStream(attendanceIds, async (row) => {
                const attendance = attendances[row.attendance_id];
                const status = statuses[row.application_id];
                await csvWriter.writeRecords([{
                    name: attendance.name,
                    date: `${moment(attendance.date).format('YYYY-MM-DD')}`,
                    start_time: toTimezoneDate(row.start_time, attendance.timezone),
                    end_time: toTimezoneDate(row.end_time, attendance.timezone),
                    total_duration: secondsToHhmmss(row.total_duration),
                    active_duration: secondsToHhmmss(row.active_seconds),
                    idle_duration: secondsToHhmmss(row.total_duration - row.active_seconds),
                    app_name: applications[row.application_id],
                    status: row.application_id in applications ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[attendance.department_id]]) : null,
                    department: attendance.department_name,
                    location: attendance.location_name,
                    emp_code: attendance.emp_code
                }]);
            });
            return filePath;
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async combinedAppWebUsageReportCSV(fileName) {
        try {
            const { orgId, empIds, startDate, endDate, depIds } = this;
         
            const csvReportHeader = {
                ...csvEmailReportHeaders.application_used[this.language] || csvEmailReportHeaders.application_used['en'],
                ...csvEmailReportHeaders.browser_history[this.language] || csvEmailReportHeaders.browser_history['en']
            }

            const empHeader = empIds.length > 0 && this.filterType != 3 ? [{ id: 'employee_name', title: csvReportHeader.employee_name }] : [];
            const deptHeader = depIds.length > 0 && this.filterType == 3 ? [{ id: 'department_name', title: csvReportHeader.department_name }] : [];
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'app_name', title: csvReportHeader.app_name },
                { id: 'total_duration', title: `${csvReportHeader.total_duration}(${this.content.appsInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'status', title: csvReportHeader.status },
                ...empHeader, ...deptHeader
            ]);

            
            console.log('-----------app/web----csv---started-------');

            await csvWriter.writeRecords([]);
            const [applicationData, websiteData] = await Promise.all([
                this.getConsolatedAppUsed({ orgId, empIds, startDate, endDate, depIds, type: 1 }),
                this.getConsolatedWebUsed({ orgId, empIds, startDate, endDate, depIds, type: 2 }),
            ])
          
            const applications = [...applicationData, ...websiteData];
            if (applications.length === 0) return filePath;
            let applicationIds = _.pluck(applications, '_id');

            let apps = {};
            for (const application of applications) {
                apps[application._id] = application.name;
            }

            const statuses = await this.getAppApplicationsStatus(applicationIds, this.depIds);
            for (const row of applications) {
                const status = statuses[row._id];
                const empData = empIds.length > 0 ? { employee_name: row.emp_name ? row.emp_name : null, } : {};
                const deptData = depIds.length > 0 ? { department_name: row.department ? row.department : null } : {};
                // const ipMaskingOrgId = process.env.IP_MASKING_ORG_ID ? process.env.IP_MASKING_ORG_ID.split(",") : null;
                // const name = ipMaskingOrgId && ipMaskingOrgId.includes(this.orgId.toString()) ? maskingIP(row.name) : row.name;
              
                await csvWriter.writeRecords([{
                    app_name: capitalize(row.name),
                    total_duration: this.content.appsInMinutes == 1 ? secondsToMmss(row.duration) : secondsToHhmmss(row.duration),
                    status: row._id in apps ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[row.department_id]] ?? 'Custom') : null,
                    ...empData, ...deptData
                }]);
            }
            console.log(filePath);
            console.log('------------app/web---csv---done---------', filePath);
            return filePath;
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async combinedAppWebUsageReportPDF(fileName, htmlFileName) {
        try {
            console.log('-----------------app/web---pdf---',)
            const { orgId, empIds, startDate, endDate, depIds } = this;

            const pdfReportHeader = csvEmailReportHeaders.application_used[this.language] || csvEmailReportHeaders.application_used['en'];
            const filePath = this.getPdfFilePath(fileName);

            const empHeader = empIds.length > 0 && this.filterType != 3 ? [{ id: 'employee_name', title: pdfReportHeader.employee_name }] : [];
            const deptHeader = this.filterType === 3 && depIds.length > 0 ? [{ id: 'department_name', title: pdfReportHeader.department_name }] : [];
            const pdfFileTableHeader = [
                { id: 'app_name', title: pdfReportHeader.app_name },
                { id: 'total_duration', title: `${pdfReportHeader.total_duration}(${this.content.appsInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'status', title: pdfReportHeader.status },
                ...empHeader, ...deptHeader
            ];
            let pdfTableRowData = [];
            let maxLength = 40;
            // adding reseller logo link
            let pdfFileLogoUrl = process.env.EMPLOGO;
            if (this.resellerData) {
                if (this.resellerData.logo && this.resellerData.logo !== 'null') pdfFileLogoUrl = this.resellerData.logo;
            }
            const pdfDoc = new PdfMaker({ filepath: filePath }).createPdfDoc();
            pdfDoc.setFont(this.language);
            pdfDoc.setDocDetails([
                `${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}`.split('_').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' '),
                `Date: ${this.reportDate}`
            ]);
            await pdfDoc.setLogo(pdfFileLogoUrl);
            pdfDoc.setTableHeaders(pdfFileTableHeader);

            // insert a new row for the pdf file
            pdfTableRowData.push({});

            const [applicationData, websiteData] = await Promise.all([
                this.getConsolatedAppUsed({ orgId, empIds, startDate, endDate, depIds, type: 1 }),
                this.getConsolatedWebUsed({ orgId, empIds, startDate, endDate, depIds, type: 2 }),
            ])

            let applications = [...applicationData, ...websiteData];
            if (applications.length === 0) return filePath;

            let applicationIds = _.pluck(applications, '_id');

            applications = applications.sort((x, y) => (x.duration < y.duration) ? 1 : (x.duration > y.duration) ? -1 : 0);

            let charts = {
                chart1: {
                    name: [],
                    duration: []
                },
                chart2: {
                    name: [],
                    duration: []
                }
            }

            let applicationDetails = []

            if (applications.length) {

                let chartData = applications.map(x => { return { name: x.name, duration: x.duration } })
                if (applications.length > 10) {
                    chartData = chartData.slice(0, 10)
                } else {
                    chartData = chartData
                }
                let name = [], duration = [];
                chartData.forEach(x => { name.push(x.name); duration.push(x.duration) });

                let numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                let numberIndex = 0, list = [];

                chartData.forEach(function (x){ list.push('<strong>' + numbers[numberIndex] + ':</strong> ' + x.name); x.name = numbers[numberIndex]; numberIndex++ })
                for (let i = list.length; i < 10; i++) { list.push('') }

                charts.chart1.name = name;
                charts.chart1.duration = duration;
                applicationDetails[0] = list;

                //Least used applications
                let leastUsedApp = applications.map(x => { return { name: x.name, duration: x.duration } })

                if (applications.length > 10) {
                    leastUsedApp = leastUsedApp.slice(applications.length - 10, applications.length)
                } else {
                    leastUsedApp = leastUsedApp
                }

                name = []; duration = [];
                leastUsedApp.forEach(x => { name.push(x.name); duration.push(x.duration) });

                let numberUsed = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                let numberIndexs = 0, appList = [];


                leastUsedApp.forEach(function (x) { appList.push('<strong>' + numberUsed[numberIndexs] + ':</strong> ' + x.name); x.name = numberUsed[numberIndexs]; numberIndexs++ })
                for (let i = appList.length; i < 10; i++) { appList.push('') }
                
                charts.chart2.name = name;
                charts.chart2.duration = duration;
                applicationDetails[1] = appList;

            }
            let publicFolderPath  = await graph.createBarChart(charts, htmlFileName, applicationDetails, startDate, endDate, 'Application/Websites', this);
            this.combinedAppWebUsageReportPDFPath = publicFolderPath;
            let apps = {};
            for (const application of applications) {
                apps[application._id] = application.name;
            }

            const statuses = await this.getAppApplicationsStatus(applicationIds, this.depIds);
            for (const row of applications) {
                const status = statuses[row._id];
                const empData = empIds.length > 0 ? { employee_name: row.emp_name ? row.emp_name : null, } : {};
                const deptData = depIds.length > 0 ? { department_name: row.department ? row.department : null } : {};
                pdfTableRowData.push({
                    app_name: row.name.length < maxLength ? capitalize(row.name) : capitalize(row.name.slice(0, maxLength)+'...'),
                    total_duration: this.content.appsInMinutes == 1 ? secondsToMmss(row.duration) : secondsToHhmmss(row.duration),
                    status: row._id in apps ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[row.department_id]] ?? 'Custom') : null,
                    ...empData, ...deptData
                });
            }

            console.log('------------app/web--pdf--done---------', filePath);

            await pdfDoc.setTableBody(pdfTableRowData).end();
            return {filePath, publicFolderPath};
        } catch (err) {
            Logger.error(`-V3---email-----${err.message}---${err}'---${__filename}----`);
            return Promise.reject(err);
        }
    }

    async appUsageReport(fileName) {
        try {
            console.log('-----------------app',)
            const { orgId, empIds, startDate, endDate, depIds } = this;

            const csvReportHeader = csvEmailReportHeaders.application_used[this.language] || csvEmailReportHeaders.application_used['en'];

            const empHeader = empIds.length > 0 && this.filterType != 3 ? [{ id: 'employee_name', title: csvReportHeader.employee_name }, { id: 'department', title: "Department" },{ id: 'location', title: "Location" },{ id: 'computer_name', title: "Computer Name" }] : [];
            const deptHeader = depIds.length > 0 && (this.filterType === 3 || this.filterType === 1) ? [{ id: 'department_name', title: csvReportHeader.department_name }] : [];
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'app_name', title: csvReportHeader.app_name },
                { id: 'total_duration', title: `${csvReportHeader.total_duration}(${this.content.appsInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'status', title: csvReportHeader.status },
                ...empHeader, ...deptHeader
            ]);

            await csvWriter.writeRecords([]);
            const applications = await this.getConsolatedAppUsed({ orgId, empIds, startDate, endDate, depIds, type: 1 });
            if (applications.length === 0) return filePath;
            let applicationIds = _.pluck(applications, '_id');

            let apps = {};
            for (const application of applications) {
                apps[application._id] = application.name;
            }

            const statuses = await this.getAppApplicationsStatus(applicationIds, this.depIds);
            for (const row of applications) {
                const status = statuses[row._id];
                const empData = empIds.length > 0 ? { employee_name: row.emp_name ? row.emp_name : null, department: row.department ?? null, location: row.location ?? null, computer_name: row.computer_name ?? null } : {};
                const deptData = depIds.length > 0 ? { department_name: row.department ? row.department : null } : {};
                await csvWriter.writeRecords([{
                    app_name: capitalize(row.name),
                    total_duration: this.content.appsInMinutes == 1 ? secondsToMmss(row.duration) : secondsToHhmmss(row.duration),
                    status: row._id in apps ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[row.department_id]] ?? 'Custom') : null,
                    ...empData, ...deptData
                }]);
            }
            console.log('------------app done---------', filePath);
            return filePath;
        } catch (err) {
            console.log('--------', err);
            return Promise.reject(err);
        }
    }

    /**
     * appUsageReportPdf
     * @memberof ReportBuilder
     * @description function to generate PDF report for the app usages
     * @param { String } fileName
     * @returns { Promise | String }
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async appUsageReportPdf(fileName ,htmlFileName, customMailSilah) {
        try {
            console.log('-----------------app---pdf---',)
            const { orgId, empIds, startDate, endDate, depIds } = this;

            const pdfReportHeader = csvEmailReportHeaders.application_used[this.language] || csvEmailReportHeaders.application_used['en'];
            const filePath = this.getPdfFilePath(fileName);
            const empHeader = empIds.length > 0 && this.filterType != 3 ? [{ id: 'employee_name', title: pdfReportHeader.employee_name }, { id: 'department', title: "Department" },{ id: 'location', title: "Location" },{ id: 'computer_name', title: "Computer Name" }] : [];
            const deptHeader = (this.filterType === 3 || this.filterType === 1) && depIds.length > 0 ? [{ id: 'department_name', title: pdfReportHeader.department_name }] : [];
            const pdfFileTableHeader = [
                { id: 'app_name', title: pdfReportHeader.app_name },
                { id: 'total_duration', title: `${pdfReportHeader.total_duration}(${this.content.appsInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'status', title: pdfReportHeader.status },
                ...empHeader, ...deptHeader
            ];
            let pdfTableRowData = [];
            let maxLength= 40;
            // adding reseller logo link
            let pdfFileLogoUrl = process.env.EMPLOGO;
            if (this.resellerData) {
                if (this.resellerData.logo && this.resellerData.logo !== 'null') pdfFileLogoUrl = this.resellerData.logo;
            }
            const pdfDoc = new PdfMaker({ filepath: filePath, customMailSilah }).createPdfDoc();
            pdfDoc.setFont(this.language);
            pdfDoc.setDocDetails([
                `${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}`.split('_').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' '),
                `Date: ${this.reportDate}`
            ]);
            await pdfDoc.setLogo(pdfFileLogoUrl);
            pdfDoc.setTableHeaders(pdfFileTableHeader);

            // insert a new row for the pdf file
            pdfTableRowData.push({});

            let applications = await this.getConsolatedAppUsed({ orgId, empIds, startDate, endDate, depIds, type: 1 });
            let applicationIds = _.pluck(applications, '_id');
            if(!config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
                applications = applications.sort((x, y) => (x.duration < y.duration) ? 1 : (x.duration > y.duration) ? -1 : 0);
            }

            let charts = {
                chart1: {
                    name: [],
                    duration: []
                },
                chart2: {
                    name: [],
                    duration: []
                }
            }

            let applicationDetails = []

            if (applications.length) {

                let chartData = applications.map(x => { return { name: x.name, duration: x.duration } })
                if (applications.length > 10) {
                    chartData = chartData.slice(0, 10)
                } else {
                    chartData = chartData
                }
                let name = [], duration = [];
                chartData.forEach(x => { name.push(x.name); duration.push(x.duration) });

                let numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                let numberIndex = 0, list = [];

                chartData.forEach(function (x){ list.push('<strong>' + numbers[numberIndex] + ':</strong> ' + x.name); x.name = numbers[numberIndex]; numberIndex++ })
                for (let i = list.length; i < 10; i++) { list.push('') }

                charts.chart1.name = name;
                charts.chart1.duration = duration;
                applicationDetails[0] = list;

                //Least used applications
                let leastUsedApp = applications.map(x => { return { name: x.name, duration: x.duration } })

                if (applications.length > 10) {
                    leastUsedApp = leastUsedApp.slice(applications.length - 10, applications.length)
                } else {
                    leastUsedApp = leastUsedApp
                }

                name = []; duration = [];
                leastUsedApp.forEach(x => { name.push(x.name); duration.push(x.duration) });

                let numberUsed = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                let numberIndexs = 0, appList = [];


                leastUsedApp.forEach(function (x) { appList.push('<strong>' + numberUsed[numberIndexs] + ':</strong> ' + x.name); x.name = numberUsed[numberIndexs]; numberIndexs++ })
                for (let i = appList.length; i < 10; i++) { appList.push('') }
                
                charts.chart2.name = name;
                charts.chart2.duration = duration;
                applicationDetails[1] = appList;

            }
            let publicFolderPath  = await graph.createBarChart(charts, htmlFileName, applicationDetails, startDate, endDate, 'Application', this);

            let apps = {};
            for (const application of applications) {
                apps[application._id] = application.name;
            }

            const statuses = await this.getAppApplicationsStatus(applicationIds, this.depIds);
            for (const row of applications) {
                const status = statuses[row._id];
                const empData = empIds.length > 0 ? { employee_name: row.emp_name ? row.emp_name : null, department: row.department ?? null, location: row.location ?? null, computer_name: row.computer_name ?? null } : {};
                const deptData = depIds.length > 0 ? { department_name: row.department ? row.department : null } : {};
                pdfTableRowData.push({
                    app_name: row.name.length < maxLength ? capitalize(row.name) : capitalize(row.name.slice(0, maxLength)+'...'),
                    total_duration: this.content.appsInMinutes == 1 ? secondsToMmss(row.duration) : secondsToHhmmss(row.duration),
                    status: row._id in apps ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[row.department_id]] ?? 'Custom') : null,
                    ...empData, ...deptData
                });
            }
            console.log('------------app--pdf--done---------', filePath);
            this.applicationHistoryHTMLPATH = publicFolderPath;
            await pdfDoc.setTableBody(pdfTableRowData).end();

            return {filePath, publicFolderPath};
        } catch (err) {
            console.log('--------', err);
            return Promise.reject(err);
        }
    }

    async browserHistory(fileName) {
        try {
            const csvReportHeader = csvEmailReportHeaders.browser_history[this.language] || csvEmailReportHeaders.browser_history['en'];
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'name', title: csvReportHeader.name },
                { id: 'department', title: csvReportHeader.department },
                { id: 'location', title: csvReportHeader.location },
                { id: 'emp_code', title: csvReportHeader.emp_code },
                { id: 'date', title: csvReportHeader.date },
                { id: 'start_time', title: csvReportHeader.start_time },
                { id: 'end_time', title: csvReportHeader.end_time },
                { id: 'domain_name', title: csvReportHeader.domain_name },
                { id: 'total_duration', title: csvReportHeader.total_duration },
                { id: 'active_duration', title: csvReportHeader.active_duration },
                { id: 'idle_duration', title: csvReportHeader.idle_duration },
                { id: 'browser_name', title: csvReportHeader.browser_name },
                { id: 'status', title: csvReportHeader.status },
                { id: 'url', title: csvReportHeader.url },
            ]);
            const attendances = await this.getAttendances();
            const attendanceIds = Object.keys(attendances).map(id => +id);
            const applications = await this.getApplications();
            let applicationIds = Object.keys(applications)
            let attendanceData = Object.values(attendances)
            let departmentIds = _.pluck(attendanceData, "department_id")
            departmentIds = _.unique(departmentIds);
            const statuses = await reportsModel.getApplicationsStatus(applicationIds, departmentIds);
            await csvWriter.writeRecords([]);
            await reportsModel.getBrowserHistoryStream(attendanceIds, async (row) => {
                const attendance = attendances[row.attendance_id];
                const status = statuses[row.application_id];
                await csvWriter.writeRecords([{
                    name: attendance.name,
                    date: `${moment(attendance.date).format('YYYY-MM-DD')}`,
                    start_time: toTimezoneDate(row.start_time, attendance.timezone),
                    end_time: toTimezoneDate(row.end_time, attendance.timezone),
                    domain_name: applications[row.domain_id],
                    total_duration: secondsToHhmmss(row.total_duration),
                    active_duration: secondsToHhmmss(row.active_seconds),
                    idle_duration: secondsToHhmmss(row.total_duration - row.active_seconds),
                    browser_name: applications[row.application_id],
                    url: row.url,
                    status: row.application_id in applications ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[attendance.department_id]]) : null,
                    department: attendance.department_name,
                    location: attendance.location_name,
                    emp_code: attendance.emp_code
                }]);
            });
            return filePath;
        } catch (err) {
            return Promise.reject(err);
        }
    }
    async browserHistoryReport(fileName) {
        try {
            const { orgId, empIds, startDate, endDate, depIds } = this;

            const csvReportHeader = csvEmailReportHeaders.browser_history[this.language] || csvEmailReportHeaders.browser_history['en'];
            const empHeader = empIds.length > 0 && this.filterType != 3 ? [{ id: 'employee_name', title: csvReportHeader.employee_name }, { id: 'department', title: "Department" },{ id: 'location', title: "Location" },{ id: 'computer_name', title: "Computer Name" }] : [];
            const deptHeader = depIds.length > 0 && (this.filterType === 3 || this.filterType === 1) ? [{ id: 'department_name', title: csvReportHeader.department_name }] : [];
            let customHeaders = [];
            if(config.AUTO_EMAIL_WEB_APP_REPORT_TITLE.includes(+this.orgId)){ 
                customHeaders.push(
                    { id: 'title', title: 'Title' },
                )
            }
            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                ...customHeaders,
                { id: 'domain_name', title: csvReportHeader.domain_name },
                { id: 'total_duration', title: `${csvReportHeader.total_duration}(${this.content.websitesInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'status', title: csvReportHeader.status },
                ...empHeader, ...deptHeader
            ]);
            console.log('-----------browser history started-------');
            await csvWriter.writeRecords([]);
            const applications = await this.getConsolatedWebUsed({ orgId, empIds, startDate, endDate, depIds, type: 2 });
            if (applications.length === 0) return filePath;
            let applicationIds = _.pluck(applications, '_id');

            let apps = {};
            let urlForTitles = [];
            for (const application of applications) {
                apps[application._id] = application.name;
                let domain = extractDomainOrIP(application.name);
                if (domain) urlForTitles.push(domain);
            }
            if (config.AUTO_EMAIL_WEB_APP_REPORT_TITLE.includes(+this.orgId) && (!this.browserHistoryTitle || Object.keys(this.browserHistoryTitle).length == 0)) {
                let promiseDomainData = urlForTitles.map((url) => getMetaData('http://' + url));
                promiseDomainData = await Promise.allSettled(promiseDomainData);
                let domainData = {};
                promiseDomainData.filter(i => i.status === 'fulfilled').map(i => {
                    domainData[extractDomainOrIP(i.value.url)] = {
                        title: i.value.title,
                        url: i.value.url
                    }
                });
                this.browserHistoryTitle = domainData;
            }

            const statuses = await this.getWebApplicationsStatus(applicationIds, this.depIds);
            for (const row of applications) {
                const status = statuses[row._id];
                const empData = empIds.length > 0 ? { employee_name: row.emp_name ? row.emp_name : null, department: row.department ?? null, location: row.location ?? null, computer_name: row.computer_name ?? null} : {};
                const deptData = depIds.length > 0 ? { department_name: row.department ? row.department : null } : {};

                let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID ? process.env.IP_MASKING_ORG_ID.split(",") : null;
                const name = ipMaskingOrgId && ipMaskingOrgId.includes(this.orgId.toString()) ? maskingIP(row.name) : row.name;  

                const rawDomain = extractDomainOrIP(name);
                const normalizedDomain = rawDomain ? rawDomain.toLowerCase() : null;
                const urlTitle =
                    this.browserHistoryTitle ? this.browserHistoryTitle[normalizedDomain]?.title : ''  ??
                    this.browserHistoryTitle[`www.${normalizedDomain}`]?.title ??
                    this.browserHistoryTitle[normalizedDomain?.replace(/^www\./, '')]?.title ??
                    prettifyDomain(normalizedDomain) ?? '--';

                await csvWriter.writeRecords([{
                    domain_name: name,
                    total_duration: this.content.websitesInMinutes == 1 ? secondsToMmss(row.duration) : secondsToHhmmss(row.duration),
                    status: row._id in apps ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[row.department_id]] ?? 'Custom') : null,
                    ...empData, ...deptData,
                    title: urlTitle,
                }]);
            }
            console.log('-----------browser history done-------', filePath)
            return filePath;
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * browserHistoryReportPdf
     * @memberof ReportBuilder
     * @description function to create a PDF report for browser history
     * @param { String } fileName
     * @returns { Promise | String }
     * @author Amit Verma <amitverma@globussoft.in>
     */
     async browserHistoryReportPdf(fileName, htmlFileName, customMailSilah) {
        try {
            const { orgId, empIds, startDate, endDate, depIds } = this;

            const pdfReportHeader = csvEmailReportHeaders.browser_history[this.language] || csvEmailReportHeaders.browser_history['en'];
            const empHeader = empIds.length > 0 && this.filterType != 3 ? [{ id: 'employee_name', title: pdfReportHeader.employee_name }, { id: 'department', title: "Department" },{ id: 'location', title: "Location" },{ id: 'computer_name', title: "Computer Name" }] : [];
            const deptHeader = depIds.length > 0 && (this.filterType === 3 || this.filterType === 1) ? [{ id: 'department_name', title: pdfReportHeader.department_name }] : [];
            let customHeaders = [];
            if(config.AUTO_EMAIL_WEB_APP_REPORT_TITLE.includes(+this.orgId)){ 
                customHeaders.push(
                    { id: 'title', title: 'Title' },
                )
            }
            const filePath = this.getPdfFilePath(fileName);
            const pdfFileTableHeader = [
                ...customHeaders,
                { id: 'domain_name', title: pdfReportHeader.domain_name },
                { id: 'total_duration', title: `${pdfReportHeader.total_duration}(${this.content.websitesInMinutes == 1 ? 'min' : 'hr'})` },
                { id: 'status', title: pdfReportHeader.status },
                ...empHeader, ...deptHeader
            ];
            console.log('-----------browser-history-started--pdf-----');

            // adding reseller logo link
            let pdfFileLogoUrl = process.env.EMPLOGO;
            if (this.resellerData) {
                if (this.resellerData.logo && this.resellerData.logo !== 'null') pdfFileLogoUrl = this.resellerData.logo;
            }
            const pdfDoc = new PdfMaker({ filepath: filePath, customMailSilah }).createPdfDoc();
            pdfDoc.setFont(this.language);
            pdfDoc.setDocDetails([
                `${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}`.split('_').map(str => str.charAt(0).toUpperCase() + str.slice(1)).join(' '),
                `Date: ${this.reportDate}`
            ]);
            await pdfDoc.setLogo(pdfFileLogoUrl);
            pdfDoc.setTableHeaders(pdfFileTableHeader);
            let pdfTableRowData = [];
            let maxLength = 40;

            // blank entry
            pdfTableRowData.push({});

            let applications = await this.getConsolatedWebUsed({ orgId, empIds, startDate, endDate, depIds, type: 2 });
            let applicationIds = _.pluck(applications, '_id');


            let ipMaskingOrgId = process.env.IP_MASKING_ORG_ID ? process.env.IP_MASKING_ORG_ID.split(",") : null;
            if(ipMaskingOrgId.includes(this.orgId.toString())){
                applications = applications.map((item)=> {
                    item.name = ipMaskingOrgId && ipMaskingOrgId.includes(this.orgId.toString()) ? maskingIP(item.name) : item.name;
                    return item;
                });
            }
            if(!config.SORT_ALL_REPORTS_USER_WISE.includes(+orgId)) {
                applications = applications.sort((x, y) => (x.duration < y.duration) ? 1 : (x.duration > y.duration) ? -1 : 0);
            }
            
            let charts = {
                chart1: {
                    name: [],
                    duration: []
                },
                chart2: {
                    name: [],
                    duration: []
                }
            }

            let webSiteDetails = []

            if (applications.length) {

                let chartData = applications.map(x => { return { name: x.name, duration: x.duration } })
                if (applications.length > 10) {
                    chartData = chartData.slice(0, 10)
                } else {
                    chartData = chartData
                }
                let name = [], duration = [];
                chartData.forEach(x => { name.push(x.name); duration.push(x.duration) });

                let numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                let numberIndex = 0, list = [];

                chartData.forEach(function (x){ list.push('<strong>' + numbers[numberIndex] + ':</strong> ' + x.name); x.name = numbers[numberIndex]; numberIndex++ })
                for (let i = list.length; i < 10; i++) { list.push('') }

                charts.chart1.name = name;
                charts.chart1.duration = duration;
                webSiteDetails[0] = list;

                //Least used applications
                let leastUsedApp = applications.map(x => { return { name: x.name, duration: x.duration } })

                if (applications.length > 10) {
                    leastUsedApp = leastUsedApp.slice(applications.length - 10, applications.length)
                } else {
                    leastUsedApp = leastUsedApp
                }

                name = []; duration = [];
                leastUsedApp.forEach(x => { name.push(x.name); duration.push(x.duration) });

                let numberUsed = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
                let numberIndexs = 0, appList = [];


                leastUsedApp.forEach(function (x) { appList.push('<strong>' + numberUsed[numberIndexs] + ':</strong> ' + x.name); x.name = numberUsed[numberIndexs]; numberIndexs++ })
                for (let i = appList.length; i < 10; i++) { appList.push('') }
                
                charts.chart2.name = name;
                charts.chart2.duration = duration;
                webSiteDetails[1] = appList;

            }
            let publicFolderPath  = await graph.createBarChart(charts, htmlFileName, webSiteDetails, startDate, endDate, 'WebSite', this);

            let apps = {};
            let urlForTitles = [];
            for (const application of applications) {
                apps[application._id] = application.name;
                let domain = extractDomainOrIP(application.name);
                if (domain) urlForTitles.push(domain);
            }

            if (config.AUTO_EMAIL_WEB_APP_REPORT_TITLE.includes(+this.orgId) && (!this.browserHistoryTitle || Object.keys(this.browserHistoryTitle).length == 0)) {
                let promiseDomainData = urlForTitles.map((url) => getMetaData('http://' + url));
                promiseDomainData = await Promise.allSettled(promiseDomainData);
                let domainData = {};
                promiseDomainData.filter(i => i.status === 'fulfilled').map(i => {
                    domainData[extractDomainOrIP(i.value.url)] = {
                        title: i.value.title,
                        url: i.value.url
                    }
                });
                this.browserHistoryTitle = domainData;
            }

            const statuses = await this.getWebApplicationsStatus(applicationIds, this.depIds);
            for (const row of applications) {
                const status = statuses[row._id];
                const empData = empIds.length > 0 ? { employee_name: row.emp_name ? row.emp_name : null, department: row.department ?? null, location: row.location ?? null, computer_name: row.computer_name ?? null } : {};
                const deptData = depIds.length > 0 ? { department_name: row.department ? row.department : null } : {};

                const rawDomain = extractDomainOrIP(row.name);
                const normalizedDomain = rawDomain ? rawDomain.toLowerCase() : null;
                const urlTitle =
                    this.browserHistoryTitle ? this.browserHistoryTitle[normalizedDomain]?.title : ''  ??
                    this.browserHistoryTitle[`www.${normalizedDomain}`]?.title ??
                    this.browserHistoryTitle[normalizedDomain?.replace(/^www\./, '')]?.title ??
                    prettifyDomain(normalizedDomain) ?? '--';

                pdfTableRowData.push({
                    domain_name: row.name.length < maxLength ? capitalize(row.name) : capitalize(row.name.slice(0, maxLength)+'...'),
                    total_duration: this.content.websitesInMinutes == 1 ? secondsToMmss(row.duration) : secondsToHhmmss(row.duration),
                    status: row._id in apps ? ('0' in status ? prodStatus[status['0']] : prodStatus[status[row.department_id]] ?? 'Custom') : null,
                    ...empData,
                    ...deptData,
                    title: urlTitle
                });
            }
            this.browserHistoryHTMLPATH = publicFolderPath;
            //create the report
            await pdfDoc.setTableBody(pdfTableRowData).end();

            console.log('-----------browser--history--done-------', filePath)
           return {filePath, publicFolderPath};
        } catch (err) {
            return Promise.reject(err);
        }
    }

    async getMessageHtml() {
        try {
            const {
                name, orgId, empIds, startDate, endDate, depIds, frequency, totalDays, reportDate,
                prevStartDate, prevEndDate,
                orgProductiveHours } = this;
            let [topApps, topWebs, prod, previousProd, empStat] = await Promise.all([
                reportsModel.topWebApps(orgId, startDate, endDate, 1, depIds, empIds),
                reportsModel.topWebApps(orgId, startDate, endDate, 2, depIds, empIds),
                reportsModel.orgStats(orgId, startDate, endDate, depIds, empIds),
                reportsModel.orgStats(orgId, prevStartDate, prevEndDate, depIds, empIds),
                reportsModel.employeePresentRate(orgId, startDate, endDate, empIds, depIds)
            ]);

            const ipMaskingOrgId = process.env.IP_MASKING_ORG_ID ? process.env.IP_MASKING_ORG_ID.split(",") : null;
            const condition = ipMaskingOrgId && ipMaskingOrgId.includes(this.orgId.toString()) ? true : false;
            topWebs = topWebs.map(element => {
                element.name = condition ? maskingIP(element.name) : element.name;
                return element;
            });

            if(config.NEW_MAIL_TEMPLATE_WITH_TIMESHEET_DATA.includes(+this.orgId)) {
                // Only generate timesheet HTML table if TIMESHEET_HEADER_REPORT exists (i.e., timeSheet or timeSheetPdf method was called)
                // If +content.timesheet === 1 but neither method was called, skip generating the table
                if (this.TIMESHEET_HEADER_REPORT && this.TIMESHEET_HEADER_REPORT_DATA) {
                    let filteredHeaders = ['name', 'email', 'date', 'start_time', 'end_time', 'total_time', 'office_time', 'active_time', 'idle_duration', 'productive_duration', 'non_productive_duration', 'neutral_duration', 'offline_duration'];
                    // Generate HTML table from timesheet data
                    const timesheetHtmlTable = this.generateTimesheetHtmlTable(
                        this.TIMESHEET_HEADER_REPORT?.filter(item => filteredHeaders.includes(item.id)),
                        this.TIMESHEET_HEADER_REPORT_DATA
                    );
                    return formatTemplate({
                        topApps, topWebs, prod, subject: name, reportDate, previousProd, empStat, totalDays, frequency, orgProductiveHours, language: this.language, resellerData: this.resellerData, reportLink: this.reportLink, orgId: this.orgId, template: this, timesheetHtmlTable
                    });
                }
            }

            return formatTemplate({
                topApps, topWebs, prod, subject: name, reportDate, previousProd, empStat, totalDays, frequency, orgProductiveHours, language: this.language, resellerData: this.resellerData, reportLink: this.reportLink, orgId: this.orgId, template: this
            });
        } catch (err) {
            console.log('-----------', err);
            return Promise.reject(err);
        }
    }

    /**
     * generateTimesheetHtmlTable
     * @memberof ReportBuilder
     * @description Generate an HTML table string from timesheet header and data with email responsive design
     * @param { Array } headers - Array of header objects with id and title properties
     * @param { Array } data - Array of data objects matching the headers
     * @returns { String } HTML table as string
     */
    generateTimesheetHtmlTable(headers, data) {
            try {
                // Return empty string if no headers or data
                if (!headers || !headers.length || !data || !data.length) {
                    return '';
                }
    
                // Start building the HTML table wrapped in tr/td to match email template structure
                // Using blue color scheme to match email template: #0b569a (header), #dbedf9 (light), #adddfb (medium)
                let html = '<tr><td bgcolor="#ffffff" style="padding: 20px 30px 30px 30px;"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td>';
                
                // Add section title
                html += '<table width="100%" style="margin-bottom: 10px;"><tr bgcolor="#0b569a"><td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 20px; text-align: center; padding: 10px 0;"><b>Timesheet Data</b></td></tr></table>';
                
                // Main data table with text wrapping to prevent overflow
                html += '<table border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; table-layout: fixed;">';
                
                // Table header with blue background matching email template
                html += '<thead><tr bgcolor="#0b569a">';
    
                // Add table headers - allow wrapping for long headers
                headers.forEach(header => {
                    html += `<th style="padding: 8px 4px; text-align: left; color: #ffffff; font-weight: bold; border: 1px solid #ffffff; font-family: Arial, sans-serif; font-size: 10px; word-wrap: break-word; word-break: break-word;">${header.title || ''}</th>`;
                });
    
                html += '</tr></thead><tbody>';
    
                // Add table rows with alternating blue tones - text wraps instead of overflow
                data.forEach((row, rowIndex) => {
                    const bgColor = rowIndex % 2 === 0 ? '#dbedf9' : '#adddfb';
                    html += `<tr bgcolor="${bgColor}">`;
    
                    headers.forEach(header => {
                        const cellValue = row[header.id] !== undefined && row[header.id] !== null ? row[header.id] : '';
                        html += `<td style="padding: 6px 4px; border: 1px solid #ffffff; text-align: left; color: #153643; font-family: Arial, sans-serif; font-size: 10px; word-wrap: break-word; word-break: break-word;">${cellValue}</td>`;
                    });
    
                    html += '</tr>';
                });
    
                html += '</tbody></table>';
                
                html += '</td></tr></table></td></tr>';
    
                return html;
            } catch (err) {
                Logger.error(`-V3---email-----generateTimesheetHtmlTable-----${err.message}---${err}'---${__filename}----`);
                return '';
            }
    }

    async sendMail() {
        try {
            let { timezone, name, recipients, content, custom } = this;
            const prevOffset = [];
            const offset = [];
            this.browserHistoryTitle = {};
            switch (+this.frequency) {
                case 1:
                    offset.push(1, 'day');
                    prevOffset.push(2, 'day');
                    break;
                case 2:
                    offset.push(1, 'weeks');
                    prevOffset.push(2, 'weeks');
                    break;
                case 3:
                    offset.push(1, 'months');
                    prevOffset.push(2, 'months');
                    break;
            }

            if(config.AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS.includes(+this.orgId)) {
                offset = [];
                prevOffset = [];
                offset.push(0, 'weeks');
                prevOffset.push(1, 'weeks');
            }

            if (custom && this.frequency == 4) {
                this.startDate = moment().format("YYYY-MM-DD")
                this.endDate = moment().format("YYYY-MM-DD")

                let startTime, endTime;
                try {
                    startTime = JSON.parse(custom).start.toString()
                    endTime = JSON.parse(custom).end.toString()
                } catch (e) {
                    startTime = custom.start.toString()
                    endTime = custom.end.toString()
                }

                //utc conversion
                let systemTimeUtc = moment().format('YYYY-MM-DD')
                const date = moment(systemTimeUtc).tz(timezone).format('YYYY-MM-DD');
                let loginStartDate = getUtcTimeZone(date, startTime, timezone)
                let loginEndDate = getUtcTimeZone(date, endTime, timezone)

                const employee_ids = _.pluck(await this.getLoginAttendances({ loginStartDate, loginEndDate }), "id");
                this.empIds = employee_ids
            }
            else {
                [this.startDate, this.endDate] = datesRange(timezone, offset, config.AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS.includes(+this.orgId));
                [this.prevStartDate, this.prevEndDate] = datesRange(timezone, prevOffset, config.AUTO_EMAIL_REPORT_WEEKLY_AND_SORTING_PRODUCTIVITY_REPORTS.includes(+this.orgId));
            }
            
            if (+this.frequency == 9) {
                this.startDate = moment().add(-1, 'days').format("YYYY-MM-DD")
                this.endDate = moment().add(-1, 'days').format("YYYY-MM-DD")
            }

            // [this.prevStartDate, this.prevEndDate] = datesRange(timezone, prevOffset);
            this.reportDate = +this.frequency === 1 ? this.startDate : `${this.startDate} to ${this.endDate}`;

            this.totalDays = moment(this.endDate).diff(moment(this.startDate), 'days') + 1;
            this.dirName = temp.mkdirSync('csvWriter');
            this.dirSize = 0;
            if (this.customMailSilah) {
                let [{count}] = await reportsModel.getAttendanceCount(this.orgId, this.startDate, this.endDate, this.empIds, this.depIds);
                if(count === 0) return true;
            }

            const attachments = [];
            if (+content.timesheet === 1) {
                //csv
                if (this.reportTypes.some(item => item.toLowerCase() == 'csv')) {
                    const filename = `${name}_${this.reportDate}__${emailFileName.find(x => x.id === "3")[this.language] || emailFileName.find(x => x.id === "3")['en']}.csv`;
                    const path = await this.timeSheet(filename);
                    attachments.push({ filename, path });
                }
                //pdf
                if (this.reportTypes.some(item => item.toLowerCase() == 'pdf')) {
                    const filename = `${name}_${this.reportDate}__${emailFileName.find(x => x.id === "3")[this.language] || emailFileName.find(x => x.id === "3")['en']}.pdf`;
                    const path = await this.timeSheetPdf(filename, this.customMailSilah);
                    attachments.push({ filename, path });
                }
            }

            if (+content.productivity === 1) {
                //csv
                if (this.reportTypes.some(item => item.toLowerCase() == 'csv')) {
                    const filename = `${name}_${this.reportDate}__${emailFileName.find(x => x.id === "4")[this.language] || emailFileName.find(x => x.id === "4")['en']}.csv`;
                    const path = await this.productivity(filename);
                    attachments.push({ filename, path });
                }
                //pdf
                if (this.reportTypes.some(item => item.toLowerCase() == 'pdf')) {
                    const filename = `${name}_${this.reportDate}__${emailFileName.find(x => x.id === "4")[this.language] || emailFileName.find(x => x.id === "4")['en']}.pdf`;
                    const path = await this.productivityPdf(filename, this.customMailSilah);
                    attachments.push({ filename, path });
                }
            }
            if(config?.TIME_GROUP_AUTO_EMAIL_UPDATE?.split(',')?.includes(this.orgId.toString())) {
                if (this.reportTypes.some(item => item.toLowerCase() == 'csv')) {
                    const filename = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}_${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}.csv`;
                    const path = await this.combinedAppWebUsageReportCSV(filename);
                    attachments.push({ filename, path });
                }
                //pdf
                if (this.reportTypes.some(item => item.toLowerCase() == 'pdf')) {
                    const pdfFileName = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}_${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}.pdf`;
                    const htmlFileName = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}_${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}.html`;
                    const { filePath, publicFolderPath } = await this.combinedAppWebUsageReportPDF(pdfFileName, htmlFileName);
                    attachments.push({ filename: pdfFileName, path: filePath });
                    attachments.push({ filename: htmlFileName, path: publicFolderPath });
                }
            }

            if (parseInt(content.apps_usage) === 1) {
                //csv
                if (this.reportTypes.some(item => item.toLowerCase() == 'csv')) {
                    const filename = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}.csv`;
                    const path = await this.appUsageReport(filename);
                    attachments.push({ filename, path });
                }
                //pdf
                if (this.reportTypes.some(item => item.toLowerCase() == 'pdf')) {
                    const pdfFileName = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}.pdf`;
                    const htmlFileName = `${this.orgId}_${Date.now()}_${name}_${this.reportDate}_${emailFileName.find(x => x.id === "1")[this.language] || emailFileName.find(x => x.id === "1")['en']}.html`;
                    const { filePath, publicFolderPath } = await this.appUsageReportPdf(pdfFileName, htmlFileName, this.customMailSilah);
                    attachments.push({ filename: pdfFileName, path: filePath });
                    attachments.push({ filename: htmlFileName, path: publicFolderPath });
                }
            }

            if (+content.websites_usage === 1) {
                //csv
                if (this.reportTypes.some(item => item.toLowerCase() == 'csv')) {
                    const filename = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}.csv`;
                    const path = await this.browserHistoryReport(filename);
                    attachments.push({ filename, path });
                }
                //pdf
                if (this.reportTypes.some(item => item.toLowerCase() == 'pdf')) {
                    const pdfFileName = `${name}_${this.reportDate}_${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}.pdf`;
                    const htmlFileName = `${this.orgId}_${Date.now()}_${name}_${this.reportDate}_${emailFileName.find(x => x.id === "2")[this.language] || emailFileName.find(x => x.id === "2")['en']}.html`;
                    const { filePath, publicFolderPath } = await this.browserHistoryReportPdf(pdfFileName, htmlFileName, this.customMailSilah);
                    attachments.push({ filename: pdfFileName, path: filePath });
                    attachments.push({ filename: htmlFileName, path: publicFolderPath });
                }
            }

            let htmlFormat = null;
            if (+content.hrms_attendance == 1) {
                //csv
                const filename = `${name}_${moment().format('YYYY-MM-DD')}_${emailFileName.find(x => x.id === "6")[this.language] || emailFileName.find(x => x.id === "6")['en']}.csv`;
                const path = await this.hrmsAttendanceReport(filename);
                attachments.push({ filename, path });
                htmlFormat = await htmlTemplate(name, moment().format('YYYY-MM-DD'));
            }
            if (+content.attendance == 1) {
                //csv
                const filename = `${name}_${moment().format('YYYY-MM-DD')}_${emailFileName.find(x => x.id === "5")[this.language] || emailFileName.find(x => x.id === "5")['en']}.csv`;
                const path = await this.attendanceReport(filename);
                attachments.push({ filename, path });
                htmlFormat = await htmlTemplate(name, moment().format('YYYY-MM-DD'));
            }
            // const att = [
            //     { filename: 'User report_2020-10-21_browser_history.csv', path: 'C:\\Users\\basu\\AppData\\Local\\Temp\\csvWriter2020922-6524-1dz0s7z.dj1i\\User report_2020-10-21_browser_history.csv' },
            //     { filename: 'User report_2020-10-21_app_used.csv', path: 'C:\\Users\\basu\\AppData\\Local\\Temp\\csvWriter2020922-6524-1dz0s7z.dj1i\\User report_2020-10-21_app_used.csv' }
            // ]
            if (attachments.length === 0) return;
            if (this.orgId == process.env.AUTO_EMAIL_ORG_REPORT_LINK) {

                Logger.info(`Selected orgId ${this.orgId}`);
                await this.createZip({ path: this.dirName, attachments, name })
                var stats = fs.statSync(`${this.dirName}/report${name + this.reportDate}.zip`);
                Logger.info(`the file size if ------${stats.size}------------`);
                this.reportLink = await this.addToDrive({ orgId: this.orgId, path: this.dirName, name })
            }
            // const zipAttachments = [{ filename: `${name}_${this.reportDate}.zip`, path: `${this.dirName}/${name}_${this.reportDate}.zip` }]
            // const outputFile = fs.createWriteStream(zipAttachments[0].path);
            // const archive = archiver('zip', { gzip: true, zlib: { level: 9 } });

            // archive.on('error', function (err) {
            //     throw err;
            // });

            // // pipe archive data to the output file
            // await archive.pipe(outputFile);

            // // append files
            // attachments.map(file => { archive.file(file.path, { name: file.filename }); });
            // await archive.finalize();
            /** get reseller admin email */
            let empAdminEmail = process.env.EMP_REPORT_EMAIL;
            if (this.resellerData) {
                const resellerDetailsObj = this.resellerData.details && this.resellerData.details.length ? JSON.parse(this.resellerData.details) : null;
                if (resellerDetailsObj && resellerDetailsObj.admin_email && resellerDetailsObj.admin_email && resellerDetailsObj.admin_email !== 'null') empAdminEmail = resellerDetailsObj.admin_email;
            }
            console.log('--------sent--',);
            let previousEmailRecipients = recipients;
            try {
                recipients = recipients.join(',');
                recipients = recipients.replace(/‬/g, "").replace(/‮/g, "");
                recipients = recipients.split(',');
            } catch (error) {
                recipients = previousEmailRecipients;
            }
            Logger.info(`----------------============= CronJobs Mail Send to ${recipients}------------------`);
            return Mailer.sendMail({
                from: empAdminEmail,
                to: recipients,
                subject: name,
                text: name,
                html: htmlFormat ? htmlFormat : await this.getMessageHtml(),
                attachments: attachments,
            }).then(response=>{
                console.log({response});
            })
            .catch(err=>{
                console.log({err});
            })

        } catch (err) {
            console.log('----------', err);
            Logger.info(`----------------============== CronJobs Mail Error ${recipients} ${err}------------------`);
            return Promise.reject(err);
        }
    }

    async sendMailBackground() {
        try {
            const { queue, redis } = jobs;
            const uuid = `sendTestMailReport:${uniqid()}`;
            await redis.set(uuid, JSON.stringify(this.arguments));
            await queue.enqueue('sendTestMailReportJob', [uuid]);
        } catch (err) {
            console.log('-----------------', err);
            return Promise.reject(err);
        }
    }

    async finalize() {
        try {
            if (!('dirName' in this)) return Promise.resolve();
            return new Promise(async (resolve) => {
                if(this.applicationHistoryHTMLPATH) fs.unlink(this.applicationHistoryHTMLPATH, err => resolve());
                if(this.browserHistoryHTMLPATH) fs.unlink(this.browserHistoryHTMLPATH, err => resolve());
                if(this.combinedAppWebUsageReportPDFPath) fs.unlink(this.combinedAppWebUsageReportPDFPath, err => resolve());
                rimraf(this.dirName, {}, () => {
                    resolve();
                });
            });
        } catch (err) {
            console.log('---------------', err);
            return Promise.reject(err);
        }
    }


    addToDrive = async ({ orgId, path, name }) => {
        try {
            const [credsData] = await UserActivityModel.getOrgStorageDetail(orgId);

            const storageType = credsData.short_code;
            const creds = JSON.parse(credsData.creds);
            const CloudDriveService = await CloudStorageServices[storageType];

            const screenLink = await CloudDriveService.uploadReport('Reports', { fileName: `report${name + this.reportDate}.zip`, mimetype: 'application/zip', path }, creds);

            return screenLink;
        }
        catch (err) {

            Logger.error(`add to drive ------${err.message}-----${err}'-------`);
        }
    }


    createZip = async ({ path, attachments, name }) => {
        try {
            const zipAttachments = [{ filename: `$report${name + this.reportDate}.zip`, path: `${path}/report${name + this.reportDate}.zip` }]
            const outputFile = fs.createWriteStream(zipAttachments[0].path);
            const archive = archiver('zip', { gzip: true, zlib: { level: 9 } });

            archive.on('error', function (err) {
                throw err;
            });

            // pipe archive data to the output file
            await archive.pipe(outputFile);

            // append files
            attachments.map(file => { archive.file(file.path, { name: file.filename }); });
            await archive.finalize();
        }
        catch (err) {
            Logger.error(`create zip error ------${err.message}-----${err}'-------`);
        }

    }

    async attendanceReport(fileName) {
        try {
            let { orgId, empIds, depIds, custom } = this;

            let data = await attendanceReport({ orgId, empIds, depIds, date: moment(custom.date).format("YYYY-MM-DD") });
            data = data.length ? data.filter(x => x.date) : data;

            let dateHeaders = [];
            if (data?.length && data[0]?.date)
                for (const element in data[0].date) {
                    dateHeaders.push({ id: moment(element).format("YYYY-MM-DD"), title: moment(element).format("Do MMM YYYY") })
                }

            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'name', title: "Name" },
                { id: 'emp_code', title: "Employee Code" },
                { id: 'department', title: "Department" },
                { id: 'location', title: "Location" },
                ...dateHeaders,
                { id: 'P', title: "Present" },
                { id: 'A', title: "Absent" },
                { id: 'L', title: "Late" },
                { id: 'H', title: "Half-Day Leave" },
                { id: 'O', title: "Over-Time" },
                { id: 'D', title: "Day-Off" },
                { id: 'EL', title: "Early Logout" },
            ]);

            await csvWriter.writeRecords([]);
            if (!data || data.length === 0) return filePath;

            for (const element of data) {
                await csvWriter.writeRecords([{
                    name: element.full_name,
                    emp_code: element.emp_code,
                    department: element.department,
                    location: element.location,
                    ...element.date,
                    P: element.P,
                    A: element.A,
                    L: element.L,
                    H: element.H,
                    O: element.O,
                    D: element.D,
                    EL: element.EL
                }]);
            }
            console.log('-----------Attendance done-------', filePath)
            return filePath;
        } catch (err) {
            return Promise.reject(err);
        }
    }


    async hrmsAttendanceReport(fileName) {
        try {
            let { orgId, empIds, depIds, custom } = this;

            let data = await hrmsAttendanceReport({ orgId, empIds, depIds, date: moment(custom.date).format("YYYY-MM-DD") });
            data = data && data?.length ? data : [];

            let dateHeaders = [];
            if (data.length && data[0]?.attendance)
                for (const element in data[0].attendance) {
                    dateHeaders.push({ id: moment(element).format("YYYY-MM-DD"), title: moment(element).format("Do MMM YYYY") })
                }

            const { filePath, csvWriter } = this.getCvsWriter(fileName, [
                { id: 'name', title: "Name" },
                { id: 'emp_code', title: "Employee Code" },
                { id: 'department', title: "Department" },
                { id: 'location', title: "Location" },
                ...dateHeaders,
                { id: 'P', title: "Present" },
                { id: 'A', title: "Absent" },
                { id: 'L', title: "Leave" },
                { id: 'H', title: "Holiday" },
                { id: 'W', title: "Week-Off" }
            ]);

            await csvWriter.writeRecords([]);
            if (!data || data.length === 0) return filePath;

            for (const element of data) {
                await csvWriter.writeRecords([{
                    name: element.name,
                    emp_code: element.emp_code,
                    department: element.department,
                    location: element.location,
                    ...element.attendance,
                    P: element.P,
                    A: element.A,
                    L: element.L,
                    H: element.H,
                    W: element.W
                }]);
            }
            console.log('-----------HRMS Attendance done-------', filePath)
            return filePath;
        } catch (err) {
            return Promise.reject(err);
        }
    }
}

/**
 * getResellerData
 * @description function to get the Reseller data
 * @param {*} resellerDataObj 
 * @param {*} nodeName 
 */
function getResellerData(resellerDataObj, nodeName) {
    if (
        resellerDataObj &&
        resellerDataObj[nodeName] &&
        resellerDataObj[nodeName].length &&
        resellerDataObj[nodeName] != 'null'

    ) {
        return resellerDataObj[nodeName];
    }
    return null;
}

function getUtcTimeZone(date, time, timezone) {

    const [hours, minutes, seconds] = time.split(':');
    let isoDate = moment.tz(date.substr(0, 10), timezone).set({ hours, minutes: minutes, seconds, milliseconds: 0 }).utc();

    let fullDate = new Date(isoDate.toISOString());
    let year = fullDate.getFullYear();
    let month = fullDate.getMonth() + 1;
    let dt = fullDate.getDate();
    let second = fullDate.getSeconds()
    let minute = fullDate.getMinutes()
    let hour = fullDate.getHours()

    if (dt < 10) { dt = '0' + dt; }
    if (month < 10) { month = '0' + month; }
    if (second < 10) { second = '0' + second; }
    if (minute < 10) { minute = '0' + minute; }
    if (hour < 10) { hour = '0' + hour; }
    let finalDate = year + '-' + month + '-' + dt + ' ' + hour + ':' + minute + ':' + second;
    return finalDate;
}

module.exports.ReportBuilder = ReportBuilder;


function extractDomainOrIP(input) {
    try {
        // 1. Decode the string
        const decoded = decodeURIComponent(input);
        // 2. Regex to match:
        //    - IPs with optional ports (e.g., 84.32.41.182:2083)
        //    - Hostnames/domains (e.g., xarnotrevz.com)
        const matches = decoded.match(
            /\b((?:\d{1,3}\.){3}\d{1,3})(?::\d+)?\b|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/g
        );
        if (matches && matches.length > 0) {
            // Return the first matched domain or IP (without port)
            return matches[0].split(':')[0];
        }
    } catch (e) {
        console.warn('Error decoding input:', e.message);
    }
    return null;
}

function prettifyDomain(domain) {
    if(!domain) return domain;
    return domain
        .toLowerCase()
        .replace(/\.(com|net|org|co|io|in|info|gov|edu|me|dev|ai|us|uk|ca|xyz)(\:\d+)?$/, '') // remove common TLDs and ports
        .replace(/^www\./, '')     // remove leading www
        .replace(/[^a-z0-9.]/gi, '') // sanitize unwanted characters
        .split('.')
        .join(' ')
        .replace(/\b\w/g, c => c.toUpperCase()); // capitalize each word
}