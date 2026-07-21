const createStructureValidation = require('./create-structure.validation.js');
const createStructureService = require('./create-structure.service.js');

class PayrollCreateStructureController {

    /**
     * getPayrollCreateStructure - function to handle get request for the create strucutre
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async getPayrollCreateStructure(req, res) {
        try {
            const { organization_id, language } = req.decoded;
            // todo: add the query for get
            let policyId = null;

            const [fetchCreatedPayrollStructure, fetchOrgSettings] = await Promise.all([
                createStructureService.getPayrollCreateStructure(policyId, organization_id),
                createStructureService.getOrgPayrollSettings(organization_id)
            ]);
            return res.json({
                code: 200,
                salaryStructure: fetchOrgSettings && fetchOrgSettings.salaryStructure ? fetchOrgSettings.salaryStructure : null,
                data: fetchCreatedPayrollStructure, error: null, message: 'Get Create Structure',
            });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, data: null, error: true, message: err.message });
        }
    }

    /**
     * postPayrollCreateStructure - function to handle post request for the create structure
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async postPayrollCreateStructure(req, res) {
        try {
            const { organization_id, language } = req.decoded;

            const { error, value: postBody } = createStructureValidation.postPayrollCreateStructureValdation(req.body);
            // return error response for validation Failed.
            if (error) return res.json({ code: 404, message: 'validation Failed.', data: null, error: error.details[0].message });

            const createStructureStatus = await createStructureService.createPayrollStructure(postBody, organization_id);

            return res.json({ code: 200, data: createStructureStatus, error: false, message: 'Post Create Structure' });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, data: null, error: true, message: err.message });
        }
    }

    /**
     * putPayrollCreateStructure - function to handle put request for the create structure
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amitverma@globussoft.in>
     */
    async putPayrollCreateStructure(req, res) {
        try {
            const { organization_id, language } = req.decoded;

            const { error, value: updateBody } = createStructureValidation.putPayrollCreateStructureValdation(req.body);
            // return error response for validation Failed.
            if (error) return res.json({ code: 404, message: 'validation Failed.', data: null, error: error.details[0].message });

            const putCreateStructureStatus = await createStructureService.updatePayrollStructure(updateBody, organization_id);

            return res.json({ code: 200, data: putCreateStructureStatus, error: false, message: 'Salary Structure Data.' });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, data: null, error: true, message: err.message });
        }
    }

    /**
     * getSalaryComponentForCreateStructure - function to handle salary component request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma <amtiverma@globussoft.in>
     */
    async getSalaryComponentForCreateStructure(req, res) {
        try {
            const { organization_id, language } = req.decoded;

            const getSalaryComponentData = await createStructureService.getSalaryComponentData(organization_id);

            return res.json({ code: 200, data: getSalaryComponentData, error: false, message: 'Put Create Structure' });
        } catch (err) {
            console.log(err);
            return res.json({ code: 400, data: null, error: true, message: err.message });
        }
    }
}

module.exports = new PayrollCreateStructureController();