const _ = require('underscore');
const UrlModel = require('./UrlClassifiactin.model');
const axios = require('axios');

let api_path = process.env.UPDATE_URL_PREDICTION_LINK_LOCAL;
let model_path = process.env.PYTHON_URL_MODEL_LINK_LOCAL;
// let model_path = 'https://ml.dev.empmonitor.com/url-classification'
// let api_path = 'https://ff2c2dbe6fb1.ngrok.io/api/v3/ai/add-url-status';
if (process.env.NODE_ENV === 'development') {
    model_path = process.env.PYTHON_URL_MODEL_LINK_DEV;
    api_path = process.env.UPDATE_URL_PREDICTION_LINK_DEV;
} else if (process.env.NODE_ENV === 'production') {
    model_path = process.env.PYTHON_URL_MODEL_LINK_DEV;
    api_path = process.env.UPDATE_URL_PREDICTION_LINK_PRODUCTION;;
}
var events = require('events');
var eventEmitter = new events.EventEmitter();

eventEmitter.on('url_classification', async activityUrl => {
    try {
        // console.log('---------------------', activityUrl)
        let model_inputs = activityUrl.data
        if (model_inputs.length > 0) {
            const urls = _.pluck(model_inputs, 'url');
            const attendance_id = activityUrl.attendance_id;
            const predicted_url = await getPredictedUrl(attendance_id, urls)

            let non_update;
            if (predicted_url.length) {
                for (const i of model_inputs) {
                    let find_predicted_uri = predicted_url.find(x => { return x.url == i.url })
                    if (find_predicted_uri) {
                        let up_pre = await UrlModel.updateUrlPredictionStatus(i.id, find_predicted_uri.prediction);
                    }
                }
                non_update = model_inputs.map(x => ({ url: x.url, id: x.id })).filter(item => item && !predicted_url.find(x => x.url === item.url));
            }
            else {
                non_update = model_inputs;
            }
            if (non_update.length) {
                // non_update = non_update.filter(element => {
                //     return element.url != ''
                // })
                // console.log(non_update, '---------------------')
                let postData = { data: non_update, api_path: api_path };
                axios.post(model_path, postData, {
                    headers: { 'Content-Type': 'application/json' }
                }).catch(() => null);
            }
        }
    } catch (err) {
        console.log('--------Failed to URL classification ---------', err)
    }
});

module.exports = eventEmitter;
async function getPredictedUrl(attendance_id, urls) {

    if (attendance_id && urls.length) {
        let predicted_uris = await UrlModel.getPredictionURL(attendance_id, urls);
        if (predicted_uris.length > 0) return predicted_uris;
        else return [];
    }
    return [];
}

















