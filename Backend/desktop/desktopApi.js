'use strict';
if (process.env.NODE_ENV === 'production') require('newrelic');
if (process.env.IS_DEBUGGING) console.log(`= server.js loaded => ${process.env.NODE_ENV} =`);


/**
 * initialising app
 * every varibale in .env will be available in process.env object
 */
const dotenv = require('dotenv');
dotenv.config();

/**
 * initialising app
 */
const App = require('./src/App');
// const cluster = require('cluster');

// if (cluster.isMaster) {
//     const numWorkers = require('os').cpus().length;

//     console.log('Master cluster setting up ' + numWorkers + ' workers...');

//     for (var i = 0; i < numWorkers; i++) {
//         cluster.fork();
//     }

//     cluster.on('online', function (worker) {
//         console.log('Worker ' + worker.process.pid + ' is online');
//     });

//     cluster.on('exit', function (worker, code, signal) {
//         console.log('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
//         console.log('Starting a new worker');
//         cluster.fork();
//     });
// } else {
App.core();
// }



// const heapProfile = require('heap-profile');
// heapProfile.start();
// setInterval(() => {
//     heapProfile.write((err, filename) => {
//         console.log(`heapProfile.write. err: ${err} filename: ${filename}`);
//     });
// }, 2 * 60 * 60 * 1000);