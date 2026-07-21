"use strict";
if (process.env.IS_DEBUGGING) console.log(__filename);

/**
 * Index routes 
 * Basically contains unauthenticated routes's callback
 * and server status routes's callback
 */

class RootIndex {
    entryRoute(req, res) {
        res.send('Hi i m there !!!');
    }

    showReqRoute(req, res) {
        res.json({
            body: req.body,
            params: req.params,
            query: req.query
        });
    }
}

module.exports = new RootIndex;


// const mySql = require('../../database/MySqlConnection').getInstance();
// (async function () {
//     let users = await mySql.query('Select name from users');
//     console.log(users);
// })();

// const EncoderDecoderHelper = require('./../../utils/helpers/EncoderDecoder');
// let encoderDecoder = new EncoderDecoderHelper();
// console.log('=====', encoderDecoder.encodeCrypto({ name: 'Vikash' }));