const router = require('express').Router();

const LocationController = require('./location.controller');
// const GeoLoactionController = require('./geolocation/geolocation.controller')

class EmployeeRoutes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        this.myRoutes.post('/add-location', LocationController.addLocation);
        this.myRoutes.post('/get-locations-dept', LocationController.getLocationWithDepartment);
        this.myRoutes.put('/update-location', LocationController.UpdateLocation);
        this.myRoutes.delete('/delete-location', LocationController.deleteLocation);
        this.myRoutes.post('/add-department-location', LocationController.addDepartmentToLocation);
        this.myRoutes.delete('/delete-dept-location', LocationController.deleteLocationDepartmets);
        this.myRoutes.post('/get-department-by-location', LocationController.getDepartmentByLocation);
        this.myRoutes.post('/get-locations', LocationController.getLocation);
        this.myRoutes.get('/roles', LocationController.roles);

        this.myRoutes.get('/get-geolocation', LocationController.getGeoLocation);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = EmployeeRoutes;