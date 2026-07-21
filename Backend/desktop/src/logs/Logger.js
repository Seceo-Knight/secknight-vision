'use strict';
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

const env = process.env.NODE_ENV || 'development';
const logDir = path.join(__dirname, 'errorLog');

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
    filename: `${logDir}/%DATE%-error.log`,
    datePattern: 'YYYY-MM-DD',
    maxFiles: '15d',
    maxSize: '100m'
});

class Logger {
    constructor() {
        this.logger = createLogger({
            level: env === 'error',
            format: format.combine(
                format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                format.printf(info => `${info.timestamp} ${process.pid} ${info.level}: ${info.message}`)
            ),
            transports: [
                new transports.Console({
                    level: 'info',
                    format: format.combine(
                        format.colorize(),
                        format.printf(
                            info => `${info.timestamp} ${info.level}: ${info.message}`
                        )
                    )
                }),
                dailyRotateFileTransport
            ]
        });
    }
}

module.exports = new Logger;
