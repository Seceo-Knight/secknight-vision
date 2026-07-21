const timekeeper = require('timekeeper');

require('dotenv').config({path: '.test.env'});
process.env.TZ = 'UTC';

const chai = require('chai');
const assertArrays = require('chai-arrays');
chai.use(assertArrays);
const {assert, expect} = chai;

const request = require('./request');
const fixtures = require('../fixtures/Fixtures');
const auth = require('./auth');

const travelTo = async (time, callback) => {
    timekeeper.freeze(time);
    await callback();
    timekeeper.reset();
};

module.exports = {
    request, assert, expect, auth, fixtures, travelTo
};