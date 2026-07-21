const path = require('path');

global.utilsFolder = __dirname;
global.publicFolder = `${__dirname.split('src')[0]}public`;
global.eventsFolder = `${__dirname.split('src')[0]}src/event`;
global.loggerFolder = `${__dirname.split('src')[0]}src/logger`;
global.dbFolder = `${__dirname.split('src')[0]}src/database`;
global.modelFolder = `${__dirname.split('src')[0]}src/models`;

