'use strict';

module.exports = (conn) => {

    function sendToQueue(q, payload) {
        return new Promise((resolve, reject) => {
            conn.createChannel((err, channel) => {
                if (err != null) return reject(err);

                channel.assertQueue(q);
                channel.sendToQueue(q, Buffer.from(payload));
                resolve('added in queue');
            });
        });
    }

    return {
        sendToQueue
    }
    
}