const mySql = require('../../../../database/MySqlConnection').getInstance();


class JobpostsModel {

    fetchJobPostsList(organization_id) {
        let query = `SELECT * FROM jobs
         WHERE organization_id =(?)`;
        return mySql.query(query, [organization_id]);
    }

    fetchJobPostsListById(jobpost_id) {
        let query = `SELECT * FROM jobs
                     WHERE id =(?)`;
        return mySql.query(query, [jobpost_id]);
    }

    addJobPosts(job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status, organization_id) {
        let query = 'INSERT INTO `jobs` (`job_title`, `job_type`, `job_vacancy`, `gender`, `minimum_experience`, `date_of_closing`, `short_description`, `long_description`, `status`, `organization_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        return mySql.query(query, [job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status, organization_id]);
    }

    updateJobPosts(id, job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status) {
        let query = `UPDATE jobs SET job_title=(?), job_type=(?), job_vacancy=(?), gender=(?), minimum_experience=(?), date_of_closing=(?), short_description=(?), long_description=(?), status=(?)
                     WHERE id =(?)`;
        return mySql.query(query, [job_title, job_type, job_vacancy, gender, minimum_experience, date_of_closing, short_description, long_description, status, id]);

    }

    deleteJobPosts(jobpost_id) {
        let query = `DELETE FROM jobs
                     WHERE id =(?)`;
        return mySql.query(query, [jobpost_id]);
    }

}

module.exports = new JobpostsModel;