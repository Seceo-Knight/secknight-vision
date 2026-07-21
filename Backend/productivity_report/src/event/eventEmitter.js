const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter;

const eventHandler = require('./eventHandler');
  
event.on('update_location', eventHandler.updateLocationHandler);
event.on('update_department', eventHandler.updateDepartmentHandler);

module.exports = event;