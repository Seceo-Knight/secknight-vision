const familyModel = require('./family.model');
const defaultFamilyDataObj = {
    isContactPerson: false,
    contactNo: null,
    bloodGroup: null
};
class FamilyService {

    /**
     * getFamily - function to process get request
     * 
     * @param {*} employeeId 
     * @returns 
     * @author Amit Verma<amitverma@globussoft.in>
     */
    async getFamily(employeeId) {
        try {
            const [familyData] = await familyModel.getFamily(employeeId);
            if (!familyData || !familyData.family) throw new Error('No Data.')

            return JSON.parse(familyData.family).map(d => ({ ...defaultFamilyDataObj, ...d }));
        } catch (err) {
            throw err;
        }
    }

    /**
     * createFamily - function to process create request
     * 
     * @param {*} qualificationData 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async createFamily(familyData, organizationId) {
        try {
            const { employeeId, ...createData } = familyData;

            const [checkEmpExistsInSystem] = await familyModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const [chectEmployeeExists] = await familyModel.checkEmployeeExists(employeeId);
            let familyJsonData = [];
            if (!chectEmployeeExists.has_employee) {
                await familyModel.createEmployeeDetailsWithExp(employeeId, familyJsonData);
            }
            const [checkEmployeeExistsWithFamily] = await familyModel.checkEmployeeExistsWithFamily(employeeId);

            if (checkEmployeeExistsWithFamily.has_family) {
                const [familyData] = await familyModel.getFamily(employeeId);
                if (familyData && familyData.family && familyData.family.length) {
                    familyJsonData = JSON.parse(familyData.family);
                }
            }

            // check member already exists
            const isMemberExists = familyJsonData.find(
                fd =>
                    (
                        fd.nameOfFamilyMember && createData.nameOfFamilyMember &&
                        fd.nameOfFamilyMember.toLowerCase() == createData.nameOfFamilyMember.toLowerCase()
                    ) &&
                    (fd.age && createData.age && fd.age == createData.age) &&
                    (
                        fd.relationShipWithEmployee && createData.relationShipWithEmployee &&
                        fd.relationShipWithEmployee.toLowerCase() == createData.relationShipWithEmployee.toLowerCase()
                    )
            );
            if (isMemberExists) {
                throw Error("Same Name Age and Relationship is already added.");
            }

            familyJsonData.push(createData);

            const createFamilyStatus = await familyModel.updateFamily(familyJsonData, employeeId);
            return await this.getFamily(employeeId);
        } catch (err) {
            throw err;
        }
    }

    /**
     * updateFamily - function to process update request
     * 
     * @param {*} qualificationData 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async updateFamily(familyData, organizationId) {
        try {
            const { employeeId, ...updateBody } = familyData;

            const [checkEmpExistsInSystem] = await familyModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const familyJsonData = await this.getFamily(employeeId);
            const checkUserExist = familyJsonData.find(data => data._id == updateBody._id);

            if (!checkUserExist) throw new Error("Invalid _id value for update.");

            const index = familyJsonData.indexOf(checkUserExist);
            familyJsonData.splice(index, 1, Object.assign(checkUserExist, updateBody));
            const updateStatus = await familyModel.updateFamily(familyJsonData, employeeId);
            return familyData;
        } catch (err) {
            throw err;
        }
    }

    /**
     * deleteFamily - function to process delete request
     * 
     * @param {*} deleteBody 
     * @param {*} organizationId 
     * @returns 
     * @author Amit Verma<amitverma@gloubssoft.in>
     */
    async deleteFamily(deleteBody, organizationId) {
        try {
            const { employeeId } = deleteBody;

            const [checkEmpExistsInSystem] = await familyModel.checkEmployeeExistsInSystem(employeeId, organizationId)
            if (!checkEmpExistsInSystem.has_employee_in_system) throw new Error('Invalid employeeId');

            const familyJsonData = await this.getFamily(employeeId);
            const checkUserExist = familyJsonData.find(data => data._id == deleteBody._id);

            if (!checkUserExist) throw new Error("Invalid _id value for delete.");

            const index = familyJsonData.indexOf(checkUserExist);
            familyJsonData.splice(index, 1);
            const updateStatus = await familyModel.updateFamily(familyJsonData, employeeId);
            return true;
        } catch (err) {
            throw err;
        }
    }
}

module.exports = new FamilyService();