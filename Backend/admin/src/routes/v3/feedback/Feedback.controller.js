const FeedbackValidator = require('./Feedback.validator')
const FeedbackModel = require('./Feedback.model');
const QuestionsList = require('./questions');
const { redis } = require('../../../jobs/index')
const moment = require('moment');
const { feedbackMessage } = require("../../../utils/helpers/LanguageTranslate");

const reponseMessage = async (language, id) => {
    return await feedbackMessage.find(x => x.id === id)[language] || projectMessages.find(x => x.id === id)["en"]

}

class FeedbackController {
    async getQuestions(req, res, next) {
        const language = req.decoded.language;
        try {
            let Questions = await QuestionsList(language)
            return res.json({ code: 200, data: Questions, message: await reponseMessage(language, "1"), error: null });
        } catch (err) {
            next(err)
        }
    }

    async addAnswer(req, res, next) {
        try {

            /**If stattus is 1 and question id 0 
             * means admin  skiped the rewiev
             */
            const language = req.decoded.language;
            const organization_id = req.decoded.organization_id;
            let today = moment().utc().format("YYYY-MM-DD");
            if (req.body.status == 1) {
                const insertSkip = await FeedbackModel.addAnswer([[0, 0, null, organization_id, `${today}`, req.body.status]])
                if (insertSkip) {
                    if (insertSkip.affectedRows) return res.json({ code: 200, data: null, message: await reponseMessage(language, "1"), error: null });
                    return res.json({ code: 400, data: null, message: await reponseMessage(language, "2"), error: null });
                }
                return res.json({ code: 400, data: null, message: await reponseMessage(language, "2"), error: null });
            } else {
                let { data, status } = await FeedbackValidator.addAnswer().validateAsync(req.body);
                let inser_list = data.map(itr => [itr.question_id, itr.option_id, itr.comment, organization_id, `${today}`, status])
                const insert = await FeedbackModel.addAnswer(inser_list)
                if (insert) {
                    if (insert.affectedRows) return res.json({ code: 200, data: null, message: await reponseMessage(language, "1"), error: null });
                    return res.json({ code: 400, data: null, message: await reponseMessage(language, "2"), error: null });
                }
                return res.json({ code: 400, data: null, message: await reponseMessage(language, "2"), error: null });
            }
        } catch (err) {
            next(err)
        }
    }
}
module.exports = new FeedbackController;

// async function reponseMessage(language, id) {
//     return feedbackMessage.find(x => x.id === id)[language] || projectMessages.find(x => x.id === id)["en"]

// }

// (async () => {
//     let data = await reponseMessage("es", "1")
//     console.log(data, '-------------------')
// })
    // ()