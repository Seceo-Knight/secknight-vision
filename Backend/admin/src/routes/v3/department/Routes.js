const router = require('express').Router();

const DepartmentController=require('./Department.controller');


class EmployeeRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }
    
    core() {
        //New Department Routes
        this.myRoutes.post('/create-departments', DepartmentController.createDepartment);
        this.myRoutes.post('/get-departments', DepartmentController.getDepartments);
        this.myRoutes.post('/get-departments-productivity-rules', DepartmentController.getDepartmentsProductivityRules);
        this.myRoutes.put('/update-department', DepartmentController.updateDepartment);
        this.myRoutes.delete('/delete-department', DepartmentController.deleteDepartment);
        this.myRoutes.delete('/delete-department-new', DepartmentController.deleteDepartmentNew);

    }
    
    getRouters() {
        return this.myRoutes;
    }
}

module.exports = EmployeeRoutes;