const mySql = require('../../../../database/MySqlConnection').getInstance();

class HolidayModel {

    fetchholidaysList(organization_id, current_date) {
        let query = `SELECT * FROM holidays
          WHERE organization_id =(?) AND holiday_date>='${current_date}'`;
          
        return mySql.query(query, [organization_id]);
    }
    fetchholidaysByYear(organization_id, year ) {
        let query = `SELECT * FROM holidays
          WHERE organization_id =(?) AND YEAR(holiday_date) =(?)`;
          
        return mySql.query(query, [organization_id,year]);
    }
    

    addholidays(holidays) {
        let query = 'INSERT INTO `holidays` (`holiday_name`, `holiday_date`, `organization_id`) VALUES ?';
        return mySql.query(query, [holidays]);
    }


    deleteHolidays(ids, organization_id) {
        let query = `DELETE FROM holidays
                     WHERE id =(?)`;
        return mySql.query(query, [ids]);
    }

    getHolidayList(organization_id) {
        let query = `SELECT id, holiday_name, holiday_date FROM holidays
                     WHERE organization_id =(?)`;
        return mySql.query(query, [organization_id]);
    }

    updateHoliday(id, holiday_name, holiday_date, organization_id) {
        let query = `UPDATE holidays SET holiday_name=(?), holiday_date=(?)
        WHERE id=(?) AND organization_id=(?)`;
        return mySql.query(query, [holiday_name, holiday_date, id, organization_id]);
    }

    getHolidayName(holiday_name, start, end, organization_id) {
        let query = `SELECT id, holiday_name, holiday_date FROM holidays
                     WHERE holiday_name IN (?) AND organization_id=? AND holiday_date BETWEEN (?) AND (?)`;
        return mySql.query(query, [holiday_name, organization_id, start, end]);
    }

    getHolidayDate(holiday_date, organization_id) {
        let query = `SELECT id, holiday_name, holiday_date FROM holidays
                     WHERE holiday_date IN(?) AND organization_id=?`;
        return mySql.query(query, [holiday_date, organization_id]);
    }
    
    getHolidaynameList( holiday_name, organization_id ) {
        let query = `select holiday_name from holidays
                    where holiday_name=(?) AND organization_id=(?)`;

        return mySql.query(query, [holiday_name,organization_id]);
    }
    getHolidaydateList(holiday_date,  organization_id) {
        let query = `select holiday_date from holidays
                    where holiday_date=(?) AND organization_id=(?) `;
                    return mySql.query(query, [holiday_date,organization_id]);
    }
}


module.exports = new HolidayModel;