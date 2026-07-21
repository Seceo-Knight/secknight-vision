const DashboardModel = require('../Dashboard.model');

class EmployeeService {
    async getRegisteredEmp(organization_id, manager_id) {
        return DashboardModel.getUsersOfOrg(organization_id, manager_id);
    }

    async getSuspendedEmp(organization_id, manager_id) {
        return DashboardModel.getSuspendedUsersOfOrg(organization_id, manager_id);
    }

    async getAbsentEmp(organization_id, manager_id, date) {
        return DashboardModel.getAbsentUsers(organization_id, manager_id, date);
    }

    async getOnlineEmp(organization_id, manager_id, date) {
        return DashboardModel.getOnlineEmployees(organization_id, manager_id, date);
    }

    async getOfflineEmp(organization_id, manager_id, date) {
        return DashboardModel.getOfflineEmployees(organization_id, manager_id, date);
    }
}

module.exports = new EmployeeService;