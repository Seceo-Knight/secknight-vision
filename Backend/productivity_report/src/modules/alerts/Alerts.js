const axios = require('axios');
const EventEmitter = require('events').EventEmitter;
const event = new EventEmitter;
event.setMaxListeners(0);

// exports.alertRequestToanotherService = async (docs) => {
//     try {
//         if (docs.length === 0) return;
//         // if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
//         await axios.post(process.env.ALERT_SERVICE_URL, { docs });
//         // }
//         return;
//     } catch (err) {
//         console.log('-------error occured------', err.message);
//     }
// }
event.on('activity', async (docs) => {
    try {
        if (docs.length === 0) return;
        // if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
        await axios.post(process.env.ALERT_SERVICE_URL, { docs });
        // }
        return;
    } catch (err) {
        console.log('-------error occured------', err.message);
    }
})

module.exports = event;


// ALERT_SERVICE_URL = http://localhost:3002/api/v3/jobs
// ALERT_SERVICE_URL= http://service.dev.empmonitor.com/api/v3/jobs