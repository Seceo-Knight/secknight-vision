'use strict';
if (process.env.IS_DEBUGGING) console.log(`= server.js loaded => ${process.env.NODE_ENV} =`);

// configuring .env file 
// every varibale in .env will be available in process.env object 
const dotenv = require('dotenv');
dotenv.config();

// initialising often used paths in Global
require('./src/utils/globalPaths');
const { multiWorker, scheduler } = require('./src/jobs');
const { WebSocketNotification } = require('./src/messages/WebSocketNotification');

// initialising app
const App = require('./src/App');
new App().core();

/**Alert will process when its enabled */
if (process.env.IS_ALERT_SERVICE_ENABLED == 'true') {
    multiWorker.start();
    scheduler.start();
}
if (process.env.PUSH_NOTIFICATION_TRANSPORT === 'websocket') {
    WebSocketNotification.start();
}