const qualificationModel = require('./qualification.model');

class QualificationService {

    /**
     * getQualification - function to process get request
     * 
     * @param {*} employeeId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async getQualification(employeeId) {
        try {
            const [qualificationData] = await qualificationModel.getQualification(employeeId);
            if (!qualificationData || !qualificationData.qualification) throw new Error('No Data.')

            return JSON.parse(qualificationData.qualification);
        } catch (err) {
            throw new Error('Unable to get data.');
            // throw err;
        }
    }

    /**
     * createQualification - function to process create request
     * 
     * @param {*} qualificationData 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async createQualification(qualificationData, organizationId) {
        try {
            const { employeeId, ...createData } = qualificationData;

            const [checkEmpExistsInSystem] = await qualificationModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const [chectEmployeeExists] = await qualificationModel.checkEmployeeExists(employeeId);
            let qualificationJsonData = [];
            if (!chectEmployeeExists.has_employee) {
                await qualificationModel.createEmployeeDetailsWithQualification(employeeId, qualificationJsonData);
            }
            const [checkEmployeeExistsWithQualification] = await qualificationModel.checkEmployeeExistsWithQualification(employeeId);

            if (checkEmployeeExistsWithQualification.has_qualification) {
                const [qualificationData] = await qualificationModel.getQualification(employeeId);
                if (qualificationData && qualificationData.qualification && qualificationData.qualification.length) {
                    qualificationJsonData = JSON.parse(qualificationData.qualification);
                }
            }

            qualificationJsonData.push(createData);

            const createQualificationStatus = await qualificationModel.updateQualification(qualificationJsonData, employeeId);
            return await this.getQualification(employeeId);
        } catch (err) {
            throw new Error('Unable to add.');
            // throw err;
        }
    }

    /**
     * updateQualification - function to process update request
     * 
     * @param {*} qualificationData 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async updateQualification(qualificationData, organizationId) {
        try {
            const { employeeId, ...updateBody } = qualificationData;

            const [checkEmpExistsInSystem] = await qualificationModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const qualificationJsonData = await this.getQualification(employeeId);
            const checkUserExist = qualificationJsonData.find(data => data._id == updateBody._id);

            if (!checkUserExist) throw new Error("Invalid _id value for update.");

            const index = qualificationJsonData.indexOf(checkUserExist);
            qualificationJsonData.splice(index, 1, Object.assign(checkUserExist, updateBody));
            const updateStatus = await qualificationModel.updateQualification(qualificationJsonData, employeeId);
            return qualificationData;
        } catch (err) {
            throw new Error('Unable to update.');
            // throw err;
        }
    }

    /**
     * deleteQualification - function to process delete request
     * 
     * @param {*} deleteBody 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async deleteQualification(deleteBody, organizationId) {
        try {
            const { employeeId } = deleteBody;

            const [checkEmpExistsInSystem] = await qualificationModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const qualificationJsonData = await this.getQualification(employeeId);
            const checkUserExist = qualificationJsonData.find(data => data._id == deleteBody._id);

            if (!checkUserExist) throw new Error("Invalid _id value for delete.");

            const index = qualificationJsonData.indexOf(checkUserExist);
            qualificationJsonData.splice(index, 1);
            const updateStatus = await qualificationModel.updateQualification(qualificationJsonData, employeeId);
            return true;
        } catch (err) {
            throw new Error('Unable to delete.');
            // throw err;
        }
    }
}

module.exports = new QualificationService();