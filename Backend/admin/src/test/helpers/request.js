const request = require('supertest');
require('../../utils/globalPaths');
const App = require('../../App');
const app = new App();

app.core();
module.exports = request(app.app);