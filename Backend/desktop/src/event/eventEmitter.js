const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter;

const eventHandler = require('./eventHandler');

event.on('update_app_domain', eventHandler.appDomainHandler);
event.on('update_keystroke', eventHandler.keyStrokeHandler);
event.on('update_employee_attendance', eventHandler.empAttendanceHandler);
event.on('employee_activity', eventHandler.empActivityHandler);


event.on('register', eventHandler.assignEmployeeOnRegistartion);
event.on('location_update_on_assign', eventHandler.onLocationChange);
event.on('departemnt_update_on_assign', eventHandler.onDepartmentChange);

module.exports = event;