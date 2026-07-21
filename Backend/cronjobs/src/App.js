'use strict';
globalThis.fetch = require('node-fetch');
const express = require('express');

const cronjobs = require('./cronjobs/cronjob');
const cron = require('./cronjobs/v3/cronjobs');
const Router = require("./cronjobs/v3/router/router");

class App {
    constructor() {
        // getting from process.env object, specified in .env file
        this.port = process.env.PORT;
        // express app initialization
        this.app = express();
    }

    /**
     * core method 
     * contains the basic logic of the perticular class
     * As per SOLID principle
     */
    core() {
        this.addRoutesAndMiddleWares(this.app);
        this.listenToPort(this.app, this.port);
        this.mongoConnection();
    }

    addRoutesAndMiddleWares(app) {
        app.use('/api/v3', new Router().getRouters());
    }

    mongoConnection() {
        const MongoDB = require('./database/MongoConnection');
        MongoDB.connect();
    }

    listenToPort(app, port) {
        // listen to certain port specified in .env file
        app.listen(port, () => console.log(`== Application started at ${port} ==`));
    }
}

module.exports = App;