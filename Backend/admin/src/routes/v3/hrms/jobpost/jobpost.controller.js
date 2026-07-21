const JobpostsModel = require('./jobpost.model');
const sendResponse = require('../../../../utils/myService').sendResponse;
const { translate } = require(`${utilsFolder}/messageTranslation`);
const { jobpostsMessages } = require("../../../../utils/helpers/LanguageTranslate");
const joiValidation = require('./jobpost.validation');


class JobpostsController {

    /**
    * Get JobPosts
    *
    * @function getJobPosts
    * @memberof  JobpostsController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getJobPosts(req, res) {
        let { organization_id, language } = req.decoded;
        try {
            let jobposts = [];
            jobposts = await JobpostsModel.fetchJobPostsList(organization_id)
            if (jobposts.length > 0) return sendResponse(res, 200, jobposts, translate(jobpostsMessages, "5", language), null);

            return sendResponse(res, 400, null, "No jobposts found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobpostsMessages, "6", language), null);
        }
    }

    /**
    * Get JobPosts by Id
    *
    * @function getJobPostsById
    * @memberof  JobpostsController;
    * @param {*} req
    * @param {*} res
    * @returns {object} request list or error
    */
    async getJobPostsById(req, res) {
        let { language } = req.decoded;
        let jobpost_id = req.body.jobpost_id;
        try {
            let jobposts = [];
            jobposts = await JobpostsModel.fetchJobPostsListById(jobpost_id)
            if (jobposts.length > 0) return sendResponse(res, 200, jobposts, translate(jobpostsMessages, "5", language), null);

            return sendResponse(res, 400, null, "No jobposts found", null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobpostsMessages, "6", language), null);
        }
    }

    /**
    * Create JobPosts
    *
    * @function createJobPosts
    * @memberof  JobpostsController;
    * @param {*} req
    * @param {*} res
    * @returns {object} created list or error
    */
    async createJobPosts(req, res) {
        let { organization_id, language } = req.decoded;
        let details = {};
        try {
            let { value, error } = joiValidation.addNewJobPosts(req.body);
            if (error) return sendResponse(res, 404, null, translate(jobpostsMessages, "2", language), error.details[0].message);

            let { job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status } = value;
            details = { job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status };
            const add_jobposts = await JobpostsModel.addJobPosts(job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status, organization_id);
            if (add_jobposts) {
                if (add_jobposts.insertId) {
                    return sendResponse(res, 200, {
                        add_jobposts: {
                            add_jobposts_id: add_jobposts.insertId || null
                        },
                    }, translate(jobpostsMessages, "3", language), null);
                }

            }
            return sendResponse(res, 400, null, translate(jobpostsMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobpostsMessages, "8", language), err);
        }
    }

    /**
    * Update JobPosts
    *
    * @function updateJobPosts
    * @memberof  JobpostsController;
    * @param {*} req
    * @param {*} res
    * @returns {object} updated list or error
    */
    async updateJobPosts(req, res) {
        const { organization_id, language } = req.decoded;
        let details = {};
        let id = req.body.id;
        try {
            let { value, error } = joiValidation.updateJobPosts(req.body);
            if (error) return sendResponse(res, 404, null, translate(jobpostsMessages, "2", language), error.details[0].message);

            let { id, job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status } = value;
            details = { id, job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status };
            const update_jobposts = await JobpostsModel.updateJobPosts(id, job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status);
            if (update_jobposts) {
                return sendResponse(res, 200, {
                    jobposts: {
                        jobpost_id: id
                    },
                }, translate(jobpostsMessages, "12", language), null);
            }
            return sendResponse(res, 400, null, translate(jobpostsMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobpostsMessages, "8", language), err);
        }
    }

    /**
    * Delete JobPosts
    *
    * @function deleteJobPosts
    * @memberof  JobpostsController;
    * @param {*} req
    * @param {*} res
    * @returns {object} delete list or error
    */
    async deleteJobPosts(req, res) {
        let { language } = req.decoded;
        let id = req.decoded;
        let jobpost_id = req.body.jobpost_id;
        try {
            const delete_jobposts = await JobpostsModel.deleteJobPosts(jobpost_id);
            if (delete_jobposts) return sendResponse(res, 200, [], translate(jobpostsMessages, "12", language), null);

            return sendResponse(res, 400, null, translate(jobpostsMessages, "7", language), null);
        } catch (err) {
            return sendResponse(res, 400, null, translate(jobpostsMessages, "7", language), null);
        }
    }

}

module.exports = new JobpostsController;