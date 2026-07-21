const familyValiation = require('./family.valiation');
const familyService = require('./family.service');

class FamilyController {
    /**
     * getFamily - function to handle the get request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async getFamily(req, res) {
        try {
            const { value, error } = familyValiation.getFamilyValidation(req.query);
            if (error) {
                return res.json({ code: 400, message: 'Validation Failed.', error: error.details[0].message, data: null });
            }

            const familyData = await familyService.getFamily(value.employeeId);
            return res.json({ code: 200, message: 'Employee Info Family', data: familyData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * putFamily - function to handle the put request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async postFamily(req, res) {
        try {
            const { organization_id } = req.decoded;

            const { value: postBody, error } = familyValiation.postFamilyValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: 'Validation Failed.', error: error.details[0].message, data: null });
            }
            const familyData = await familyService.createFamily(postBody, organization_id);
            return res.json({ code: 200, message: 'Family member added Successfully', data: familyData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * putFamily - function to handle the put request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async putFamily(req, res) {
        try {
            const { organization_id } = req.decoded;

            const { value: updateBody, error } = familyValiation.putFamilyValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: 'Validation Failed.', error: error.details[0].message, data: null });
            }
            const familyData = await familyService.updateFamily(updateBody, organization_id);
            return res.json({ code: 200, message: 'Family member updated Successfully', data: familyData, error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }

    /**
     * deleteFamily - function to handle the delete request
     * 
     * @param {*} req 
     * @param {*} res 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async deleteFamily(req, res) {
        try {
            const { organization_id } = req.decoded;

            const { value: deleteBody, error } = familyValiation.deleteFamilyValidation(req.body);
            if (error) {
                return res.json({ code: 400, message: 'Validation Failed.', error: error.details[0].message, data: null });
            }
            const familyData = await familyService.deleteFamily(deleteBody, organization_id);
            return res.json({ code: 200, message: 'Family member deleted Successfully', data: familyData ? 'Success' : 'Failed', error: null });
        } catch (err) {
            return res.json({ code: 400, message: err.message, error: err.message, data: null });
        }
    }
}

module.exports = new FamilyController();