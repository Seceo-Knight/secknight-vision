const JobcandidateModel = require('./jobcandidate.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { jobcandidatesMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./jobcandidate.validation');


class JobcandidateController {

    /**
    * Get JobCandidates
    *
    * @function getJobCandidates
    * @memberof  JobcandidateController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getJobCandidates(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let candidates = [];
            candidates = await JobcandidateModel.fetchJobcandidatesList(organization_id)
            if (candidates.length > 0) return sendResponse(res, 200, candidates, translate(jobcandidatesMessages, "5", language), null);

            return sendResponse(res, 400, null, "No candidates found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "6", language), null);
        }
    }

    /**
    * Get JobCandidates by Id
    *
    * @function getJobCandidates
    * @memberof  JobcandidateController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getJobCandidatesById(req, res) {
        let { organization_id, language } = req.decoded;
        let jobcandidates_id = req.body.jobcandidates_id;
        try {
            let candidates = [];
            candidates = await JobcandidateModel.fetchJobCandidatesListById(jobcandidates_id)
            if (candidates.length > 0) return sendResponse(res, 200, candidates, translate(jobcandidatesMessages, "5", language), null);

            return sendResponse(res, 400, null, "No candidates found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "6", language), null);
        }
    }

    /**
    * Create JobCandidates
    *
    * @function createJobCandidates
    * @memberof  JobcandidateController;
    * @param {*} req
    * @param {*} res
    * @returns {object} created list or error
    */
    async createJobCandidates(req, res) {
        let { organization_id, language } = req.decoded;
        let details = {};
        try {
            let { value, error } = joiValidation.addNewJobCandidates(req.body);
            if (error) return sendResponse(res, 404, null, translate(jobcandidatesMessages, "2", language), error.details[0].message);

            let { job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks } = value;
            details = { job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks };
            const add_jobcandidates = await JobcandidateModel.addJobCandidates(job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks, organization_id);
            if (add_jobcandidates) {
                if (add_jobcandidates.insertId) {
                    return sendResponse(res, 200, {
                        jobcandidates: {
                            add_jobcandidates: add_jobcandidates.insertId || null
                        },
                    }, translate(jobcandidatesMessages, "3", language), null);
                }
            }
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "7", language), null);
        } catch (err) {
            console.log(err);
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "8", language), err);
        }
    }

    /**
    * Update JobCandidates
    *
    * @function updateJobCandidates
    * @memberof  JobcandidateController;
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateJobCandidates(req, res) {
        const { organization_id, language } = req.decoded;
        let details = {};
        let id = req.body.id;
        try {
            let { value, error } = joiValidation.updateJobCandidates(req.body);
            if (error) return sendResponse(res, 404, null, translate(jobcandidatesMessages, "2", language), error.details[0].message);

            let { id, job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks } = value;
            details = { id, job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks };
            const update_jobcandidates = await JobcandidateModel.updateJobCandidates(id, job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks);
            if (update_jobcandidates) {
                return sendResponse(res, 200, {
                    jobcandidates: {
                        jobcandidates_id: id
                    },
                }, translate(jobcandidatesMessages, "12", language), null);
            }
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "13", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "13", language), err);
        }
    }

    /**
    * Delte JobCandidates
    *
    * @function deleteJobCandidates
    * @memberof  JobcandidateController;
    * @param {*} req
    * @param {*} res
    * @returns {object} delted list or error
    */
    async deleteJobCandidates(req, res) {
        let { language } = req.decoded;
        let id = req.decoded;
        let jobcandidates_id = req.body.jobcandidates_id;
        try {
            const delete_expense = await JobcandidateModel.deleteJobCandidates(jobcandidates_id);
            if (delete_expense) return sendResponse(res, 200, [], translate(jobcandidatesMessages, "12", language), null);

            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobcandidatesMessages, "7", language), null);
        }
    }

}

module.exports = new JobcandidateController;