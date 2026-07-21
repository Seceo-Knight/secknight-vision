'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const router = require('express').Router();
const AddonFeaturesController = require('./addonFeatures.controller');
const { requireSuperOrOperator } = require('./addonFeatures.middleware');

class Routes {
    constructor() {
        this.myRoutes = router;
        this.core();
    }

    core() {
        // Every route here requires super_admin OR a user in the env-configured operator org.
        this.myRoutes.use(requireSuperOrOperator);

        this.myRoutes.get('/', AddonFeaturesController.listFeatures);
        this.myRoutes.get('/organizations', AddonFeaturesController.listOrganizations);
        this.myRoutes.post('/toggle', AddonFeaturesController.toggle);
        this.myRoutes.post('/toggle-all', AddonFeaturesController.toggleAll);

        // Feature CRUD (D = soft delete / archive; feature_key is immutable after create)
        this.myRoutes.post('/', AddonFeaturesController.createFeature);
        this.myRoutes.put('/:id', AddonFeaturesController.updateFeature);
        this.myRoutes.delete('/:id', AddonFeaturesController.deleteFeature);
    }

    getRouters() {
        return this.myRoutes;
    }
}

module.exports = Routes;
