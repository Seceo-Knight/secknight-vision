const dotenv = require('dotenv');
dotenv.config();

const {App} = require('./src/App');

new App().start();