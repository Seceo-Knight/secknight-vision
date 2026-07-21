const declarationSettingService = require('../advancesettings/declaration-settings/declaration-setting.service');
const moment = require('moment');
const { concat } = require('lodash');

class DeclarationHelper {
    /**
     * @method isDeclarationWindowOpenAndActive
     * @description funtion to check window open and active
     * @param {*} organization_id 
     * @returns {Boolean}
     * @author Amit Verma <amitverma@globussoft.in>
     */
    static async isDeclarationWindowOpenAndActive(organization_id) {
        const { isDeclarationWindowOpen, yearly: yearlyDeclarationWindow } = await declarationSettingService.getDeclarationSettings(organization_id);
        const nowDate = moment().format('YYYY-MM-DD');

        if (
            !isDeclarationWindowOpen ||
            !yearlyDeclarationWindow ||
            (
                yearlyDeclarationWindow &&
                !moment(nowDate).isBetween(
                    moment(yearlyDeclarationWindow.from).format('YYYY-MM-DD'),
                    moment(yearlyDeclarationWindow.to).format('YYYY-MM-DD'),
                    'days',
                    '[]' // including start and end days
                )
            )
        ) {
            return false;
        }
        return true;
    }


    /**
     * Append remaining months to the months array
     * @function getRemainingMonthData
     * @param {*} data 
     * @param {*} date 
     * @returns financial-year months TDS data
     */
    getRemainingMonthData({ data, date }) {

        // calculate financial year from date
        const year = +moment(date).format('YYYY');
        const month = +moment(date).format('MM');
        let start = month > 3 ? `${year}-04-01` : `${year - 1}-04-01`;

        // returns data for remaining months to the financial year
        return Array(12).fill(1)
            .map((_, index) => +moment(start).add(index, 'month').format('YYYYMM'))
            .filter(x => !data.some(z => +x === +`${z.year}${String(z.month).padStart(2, '0')}`))
            .map(x => ({
                month: +x.toString().slice(4),
                year: +x.toString().slice(0, 4),
                tds_paid: 0,
                gross: 0
            }))
            .concat(data)
            .sort((x, y) => (x.year - y.year) || (x.month - y.month));
    }
}

module.exports = DeclarationHelper;