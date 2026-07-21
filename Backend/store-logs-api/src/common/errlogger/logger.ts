import { createLogger, format, transports } from "winston";
import "winston-daily-rotate-file";
import { promises as fs } from 'fs';
import { Injectable } from '@nestjs/common';
import { join, resolve } from 'path';

const logDir: string = join(resolve('./public/logger'));
// const logDir = './logger/errorLog';

// Create the log directory if it does not exist
(async () => {
    await fs.mkdir(logDir, { recursive: true });
    // }
})();

@Injectable()
export class Logger {
    // constructor(filename) {
    logger = createLogger({
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
            new transports.DailyRotateFile({
                filename: `${logDir}/%DATE%-error.log`,
                datePattern: 'YYYY-MM-DD',
                maxFiles: "5d",
                maxSize: '100m'
            })
        ]
    });
}
