const mySql = require('../../../database/MySqlConnection').getInstance();

class FeedbackModel {
    async addQuestion(question, options) {
        let query = `INSERT INTO feedback (question ,options) VALUES (?,?)`
        return mySql.query(query, [question, options]);
    }

    getQuestion(question) {
        let query = `SELECT question FROM feedback WHERE question=? `
        return mySql.query(query, [question]);
    }

    getAllQuestion() {
        let query = `SELECT question,options FROM feedback `
        return mySql.query(query);
    }

    addAnswer(inser_list) {
        return mySql.query(`
        INSERT INTO feedback (question_id,answer,comment,organization_id,rated_at,status)
        VALUES ?`, [inser_list]);
    }
}
module.exports = new FeedbackModel;