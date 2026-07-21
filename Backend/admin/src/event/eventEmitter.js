const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter;

const eventHandler = require('./eventHandler');

event.on('update_location', eventHandler.updateLocationHandler);
event.on('update_department', eventHandler.updateDepartmentHandler);
event.on('delete_employees_data', eventHandler.deleteEmployeeDetails);

event.on('update_role_permission', eventHandler.assignEmployee);
event.on('role_update', eventHandler.onRoleChange);
event.on('register', eventHandler.assignEmployeeOnRegistartion);
event.on('location_update_on_assign', eventHandler.onLocationChange);
event.on('departemnt_update_on_assign', eventHandler.onDepartmentChange);


module.exports = event;