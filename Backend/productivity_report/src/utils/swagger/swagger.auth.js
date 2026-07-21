const basicAuth = require('express-basic-auth');
const moment = require("moment");

let swaggerDefaultString = moment.utc().format('MM-YYYY-MM-DD').split('-').join(''); //1120231129

let users = {};

users[`${swaggerDefaultString}_user`] = `ATLab${swaggerDefaultString}`; // 1120231129_user: ATLab1120231129

const auth = basicAuth({
    users: users,
    challenge: true,
});


module.exports = {auth};