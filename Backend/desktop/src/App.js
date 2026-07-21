'use strict';
if (process.env.IS_DEBUGGING) console.log(__filename);

const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const morgan = require('morgan');
const compression = require('compression');
const timeout = require('express-timeout-handler');
const helmet = require('helmet');
const rateLimit = require("express-rate-limit");
const csurf = require("csurf");
const swaggerUi = require('swagger-ui-express');
const V3Routes = require('./routes/v3/modules');
const swaggerSpecV3 = require('./utils/swagger/v3/swagger-json');
const amqplib = require('./utils/rabbitMQ/connection');
const rmq_consumer = require('./utils/rabbitMQ/consumer');
const logs = require('./logs/Logger')
const { logger: Logger } = require('./logs/Logger');

const swaggerMiddleware = require("./utils/swagger/swagger.auth");

// // Redis for session mamangement across cluster
// let redisClient = require('redis').createClient();
// let redisStore = require('connect-redis')(session)


/**
 *
 * @class App
 */
class App {

    /** @constructor */
    constructor() {
        /**
         * getting from process.env object, specified in .env file
         */
        this.port = process.argv[2] || process.env.PORT;

        /**
         * @this express-app-initialization
         */
        this.app = express();
    }

    /**
     * @function core - contains the basic logic of the perticular class
     * As per SOLID principle
     */
    core() {
        this.addRoutesAndMiddleWares(this.app);
        this.mongoConnection();
        this.listenToPort(this.app, this.port);

        if (process.env.NODE_ENV === 'abcd') {
            this.rabbitMQ();
        }
    }

    /**
     * Applies Middleware to express-app
     * @function addRoutesAndMiddleWares
     * @param {Express} app
     * @memberof App
     */
    addRoutesAndMiddleWares(app) {

        /**
         * initializing body parser (bundled with express framework)
         * for reading req body
         */
        app.use(express.json({ limit: '50mb' }), express.urlencoded({ urlencoded: false, limit: '50mb', extended: true }));

        /**
         * Logger - Logging request in console
         */
        app.use(morgan('dev'));

        // Custom tokens for IP and email
        morgan.token('ip', (req) => {
            return req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        });

        morgan.token('email', (req) => {
            return req.body?.email || 'N/A'; // Default to 'N/A' if no email is present
        });

        // Create a custom format that includes IP and email, logging only for 406 status codes
        const logFormat = ':method :url :status - IP: :ip - Email: :email - :response-time ms - :res[content-length] Custom';

        //! Will enable it later after the agent popup process completes
        // app.use(morgan(logFormat, {
        //     skip: (req, res) => res.statusCode !== 406 // Skip logging for non-406 responses
        // }));


        /**
         * Added security headers
         */
        app.use(helmet());

        /**
         * handling DDOS attacks by stopping req after specified time with specific req calls
         */
        // app.use(new rateLimit({
        //     windowMs: parseInt(process.env.RATE_LIMIT_DURATION) * 60 * 1000,
        //     max: parseInt(process.env.RATE_LIMIT_REQUEST_ALLOWED)
        // }));

        /**
         * compressing res / req
         */
        app.use(compression());

        /**
         * Serving static files in Express
         */
        app.use(express.static('public'))

        /**
         * Session Management via cookies and in app storage
         */
        app.use(cookieParser());

        app.use((req, res, next) => {
            let email = req?.body?.email;
            if (req.originalUrl === '/api/v3/auth/authenticate') {
                if (email) return next();
                return res.status(406).json({ message: "Missing email in request" });
            }
            next();
        });

        const sessionObj = {
            secret: process.env.SESSION_SECRET,
            resave: false,
            saveUninitialized: true
        }

        // Redis for session management across cluster (disabled for V3)
        // if (process.env.VERSION !== 'V3' && (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development')) {
        //     const redisClient = require('redis').createClient({ url: `redis://${process.env.REDIS_HOST || 'localhost'}:6379` });
        //     const { RedisStore } = require('connect-redis');
        //     sessionObj['store'] = new RedisStore({ client: redisClient });
        // }
        // app.use(session(sessionObj));

        app.use((req, res, next) => {
            res.set({
                'compress': true,
                'Connection': 'keep-alive',
                'Keep-Alive': 'timeout=200'
            });
            next();
        });
        
        const options = {
            timeout: 60000,
            onTimeout: function (req, res) {
                Logger.error(`-V3--------server error time out---------`);
                res.json({ code: 503, message: `This request is timed out - ${req.originalUrl}`, error: 'Server Timeout', data: null });
            },
            onDelayedResponse: function (req, method, args, requestTime) {
                console.log(args)
                console.log(`"${req.originalUrl}" is timedout and Attempted to call "${method}" after timeout "${requestTime}" ms`);
            },
            disable: ['write', 'setHeaders', 'send', 'json', 'end']
        };

        app.use(timeout.handler(options));
        /**
         * Adding swagger for the routes
         */
        app.use('/api/v3/explorer',  swaggerUi.serve, (...args) => swaggerUi.setup(swaggerSpecV3)(...args));

        /**
         * Registering routes
         */
        app.use('/api/v3', new V3Routes().getRouters());
        app.use(require('./middleware/error'));

        app.use('/api/custom/on-premise-desktop', (req, res) => {
            try {
                return res.status(200).json({ code : 200, message: "Success"});
            } catch (error) {
                return res.status(500).json({ code : 500, message: "Error"});
            }
        })

        if(!process.env.IS_ON_PREM) app.get('/', (req, res) => { res.send('success'); });
        else app.get('/', (req, res) => { res.redirect('/api/v3/explorer'); });

        // Commenting Redirection
        // default route handler
        // if (process.env.VERSION === 'V3')
        //     app.get('/', (req, res) => { res.redirect('/api/v3/explorer'); });
        // else
        //     app.get('/', (req, res) => { res.redirect('/api/v1/explorer'); });

        /**
         * enable csurf tokens
         */
        // app.use(csurf());
    }

    /**
     * @function listenToPort
     * @param {Express} app - (Express App)
     * @param {Number} port
     * @memberof App
     */
    listenToPort(app, port) {

        /**
         * listen to certain port specified in .env file
         */
        this.server = app.listen(port, () => console.log(`== Application started at ${port} == in ${process.env.NODE_ENV} environment ==`));

        /**
         * Handle unhandled promise rejections
         */
        process.on('unhandledRejection', (err, promise) => {
            console.error(`Error: ${err.message}`);
            // Close server & exit process
            this.server.close(() => process.exit(1));
        });

        /**
         * opening swagger UI on node server restart
         */
        // open(`http://localhost:${port}/api/v1/explorer`);
    }

    async rabbitMQ() {
        try {
            const conn = await amqplib.connect();
            rmq_consumer(conn).consume('activity');
        } catch (err) {
            console.error(err);
        }
    }

    mongoConnection() {
        const MongoDB = require('./database/MongoConnection');
        MongoDB.connect();
    }

    getServer() {
        return this.app;
    }
}

module.exports = new App;