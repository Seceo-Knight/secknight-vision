'use strict';
if (process.env.IS_DEBUGGING) console.log(`= server.js loaded => ${process.env.NODE_ENV} =`);

// configuring .env file 
// every varibale in .env will be available in process.env object 
const dotenv = require('dotenv');
dotenv.config();

// initialising app
const App = require('./src/App');
new App().core();

// const { multiWorker, scheduler } = require('./src/jobs');

// multiWorker.start();
// scheduler.start();