const mySql = require('../../../../database/MySqlConnection').getInstance();


class JobcandidateModel {

    fetchJobcandidatesList(organization_id) {
        let query = `SELECT * FROM job_candidates
         WHERE organization_id =(?)`;
        return mySql.query(query, [organization_id]);
    }

    fetchJobCandidatesListById(jobcandidates_id) {
        let query = `SELECT * FROM job_candidates
                     WHERE id =(?)`;
        return mySql.query(query, [jobcandidates_id]);
    }

    addJobCandidates(job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks, organization_id) {
        let query = 'INSERT INTO `job_candidates` (`job_title`, `job_type`, `candidate_name`, `email`, `phone_number`, `status`, `applied_date`, `resume`, `application_remarks`, `organization_id`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        return mySql.query(query, [job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks, organization_id]);
    }

    updateJobCandidates(id, job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks) {
        let query = `UPDATE job_candidates SET job_title=(?), job_type=(?), candidate_name=(?), email=(?), phone_number=(?), status=(?), applied_date=(?), resume=(?), application_remarks=(?)
                     WHERE id =(?)`;
        return mySql.query(query, [job_title, job_type, candidate_name, email, phone_number, status, applied_date, resume, application_remarks, id]);

    }

    deleteJobCandidates(jobcandidates_id) {
        let query = `DELETE FROM job_candidates
                     WHERE id =(?)`;
        return mySql.query(query, [jobcandidates_id]);
    }


}

module.exports = new JobcandidateModel;