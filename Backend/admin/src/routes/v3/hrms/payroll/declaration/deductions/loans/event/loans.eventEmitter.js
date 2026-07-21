const EventEmitter = require('events').EventEmitter;
const loanEvent = new EventEmitter;
const { UPDATE_PROCESSED_EMPLOYEE_LOANS, UPDATE_SKIPPED_EMPLOYEE_LOANS } = require('./loans.constant');
const loanEventHandler = require('./loans.eventListener');

loanEvent.on(UPDATE_PROCESSED_EMPLOYEE_LOANS, loanEventHandler.updateProcessedEmployeeLoans);
loanEvent.on(UPDATE_SKIPPED_EMPLOYEE_LOANS, loanEventHandler.updateSkippedEmployeeLoans);



module.exports = loanEvent;