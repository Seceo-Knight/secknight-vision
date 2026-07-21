const experienceModel = require("./experience.model");

class ExperienceService {

    /**
     * getExperience - function to process get request
     * 
     * @param {*} employeeId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async getExperience(employeeId) {
        try {
            const [experienceData] = await experienceModel.getExperience(employeeId);
            if (!experienceData || !experienceData.experience) throw new Error('No Data.')

            return JSON.parse(experienceData.experience);
        } catch (err) {
            throw new Error('Unable to get data.');
            // throw err;
        }
    }

    /**
     * createExperience - function to process create request
     * 
     * @param {*} qualificationData 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async createExperience(experienceData, organizationId) {
        try {
            const { employeeId, ...createData } = experienceData;

            const [checkEmpExistsInSystem] = await experienceModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const [chectEmployeeExists] = await experienceModel.checkEmployeeExists(employeeId);
            let experienceJsonData = [];
            if (!chectEmployeeExists.has_employee) {
                await experienceModel.createEmployeeDetailsWithExp(employeeId, experienceJsonData);
            }
            const [checkEmployeeExistsWithExperience] = await experienceModel.checkEmployeeExistsWithExperience(employeeId);

            if (checkEmployeeExistsWithExperience.has_experience) {
                const [experienceData] = await experienceModel.getExperience(employeeId);
                if (experienceData && experienceData.experience && experienceData.experience.length) {
                    experienceJsonData = JSON.parse(experienceData.experience);
                }
            }

            experienceJsonData.push(createData);

            const createExperienceStatus = await experienceModel.updateExperience(experienceJsonData, employeeId);
            return await this.getExperience(employeeId);
        } catch (err) {
            throw new Error('Unable to add.');
            // throw err;
        }
    }

    /**
     * updateExperience - function to process update request
     * 
     * @param {*} qualificationData 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async updateExperience(experienceData, organizationId) {
        try {
            const { employeeId, ...updateBody } = experienceData;

            const [checkEmpExistsInSystem] = await experienceModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const experienceJsonData = await this.getExperience(employeeId);
            const checkUserExist = experienceJsonData.find(data => data._id == updateBody._id);
            if (!checkUserExist) throw new Error("Invalid _id value for update.");

            const index = experienceJsonData.indexOf(checkUserExist);
            experienceJsonData.splice(index, 1, Object.assign(checkUserExist, updateBody));
            const updateStatus = await experienceModel.updateExperience(experienceJsonData, employeeId);
            return experienceData;
        } catch (err) {
            throw new Error('Unable to update.');
            // throw err;
        }
    }

    /**
     * deleteExperience - function to process delete request
     * 
     * @param {*} deleteBody 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async deleteExperience(deleteBody, organizationId) {
        try {
            const { employeeId } = deleteBody;

            const [checkEmpExistsInSystem] = await experienceModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const experienceJsonData = await this.getExperience(employeeId);
            const checkUserExist = experienceJsonData.find(data => data._id == deleteBody._id);

            if (!checkUserExist) throw new Error("Invalid _id value for delete.");

            const index = experienceJsonData.indexOf(checkUserExist);
            experienceJsonData.splice(index, 1);
            const updateStatus = await experienceModel.updateExperience(experienceJsonData, employeeId);
            return true;
        } catch (err) {
            throw new Error('Unable to delete.');
            // throw err;
        }
    }
}

module.exports = new ExperienceService();