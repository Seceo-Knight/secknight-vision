
const OrganizationController = require('./organization.controller');
const OrganizationModel = require('./organization.model');
const OrganizationRoutes = require('./organization.routes');
const OrganizationValidation = require('./organization.validation');

module.exports.Controller = OrganizationController;
module.exports.OrganizationModel = OrganizationModel;
module.exports.Routes = OrganizationRoutes;
module.exports.Validation = OrganizationValidation;