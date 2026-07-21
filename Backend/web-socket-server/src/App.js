const http = require('http');
const serveStatic = require('serve-static');
const finalhandler = require('finalhandler');
const {Notifications} = require('./prefixes/Notifications');

class App {
    start() {
        this.startServer();
        new Notifications().start(this.server);
    }

    startServer() {
        const serve = serveStatic(`${__dirname}/../public`);
        this.server = http.createServer((req, res) => {
            if(req.url === '/api/custom/on-premise-socket') {
                res.end(JSON.stringify({code: 200,  message: "Success"}));
                return;
            }
            serve(req, res, finalhandler(req, res));
        });
        this.server.addListener('upgrade', (req, res) => {
            res.end();
        });

        this.server.listen(process.env.PORT);
        console.info(`Listening on http://localhost:${process.env.PORT}`);
    }
}

module.exports.App = App;