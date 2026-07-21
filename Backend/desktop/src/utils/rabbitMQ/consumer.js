'use strict';

const mySql = require('../../database/MySqlConnection').getInstance();

module.exports = (conn) => {

  function consume(q) {
    conn.createChannel(function (err, channel) {
      if(err) {
        console.error(err);
      }

      channel.assertQueue(q);
      channel.consume(q, function (msg) {
        mySql
          .query(msg.content.toString())
          .then((result) => {
            console.log('RabbitMQ Query Executed');
            channel.ack(msg);
          })
          .catch(err => console.log(err));
      });
    });
  }
  
  return {
    consume
  }
}