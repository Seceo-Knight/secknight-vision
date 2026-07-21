'use strict';

const amqp = require('amqplib/callback_api');

const CONN_URL = process.env.RABBITMQ_URL;

module.exports = {
  connect: () => {
    return new Promise((resolve, reject) => {
      amqp.connect(CONN_URL, (err, conn) => {
        if(err) {
          console.error(err);
          reject(err);
        }
    
        resolve(conn);
      });
    })
  }
}