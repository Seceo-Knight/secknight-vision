const redis = require('ioredis');
const alertsAndNotifications = require('./alertsAndNotifications');
const reports = require('./reports');
const mails = require('./backgroundEmail');
const { MultiWorker, Worker, Queue, Scheduler: SchedulerBase } = require('node-resque');

const jobs = {
    ...mails,
    ...reports,
    ...alertsAndNotifications
};

const redisClient = redis.createClient({
    port: 6379,
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    namespace: 'resque',
    db: process.env.REDIS_DATABASE,
});

const connectionDetails = {
    redis: redisClient,
};

const queues = ['default'];

const log = (...args) => {
    if (true || process.env.NODE_ENV !== 'development') return;
    console.log(...args);
};

const multiWorker = new MultiWorker(
    {
        connection: connectionDetails,
        queues: queues,
        minTaskProcessors: 1,
        maxTaskProcessors: 100,
        checkTimeout: 1000,
        maxEventLoopDelay: 10,
    },
    jobs,
);

multiWorker
    .on('start', (workerId) => {
        log(`worker[${workerId}] started`);
    })
    .on('end', (workerId) => {
        log(`worker[${workerId}] ended`);
    })
    .on('cleaning_worker', (workerId, worker, pid) => {
        log(`cleaning old worker ${worker} ${pid}`);
    })
    .on('poll', (workerId, queue) => {
        //log(`worker[${workerId}] polling ${queue}`);
    })
    .on('ping', (workerId, time) => {
        log(`worker[${workerId}] check in @ ${time}`);
    })
    .on('job', (workerId, queue, job) => {
        log(`worker[${workerId}] working job ${queue} ${JSON.stringify(job)}`);
    })
    .on('reEnqueue', (workerId, queue, job, plugin) => {
        log(`worker[${workerId}] reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`);
    })
    .on('success', (workerId, queue, job, result) => {
        log(`worker[${workerId}] job success ${queue} ${JSON.stringify(job)} >> ${result}`);
    })
    .on('failure', (workerId, queue, job, failure) => {
        log(`worker[${workerId}] job failure ${queue} ${JSON.stringify(job)} >> ${failure}`);
    })
    .on('error', (workerId, queue, job, error) => {
        log(`worker[${workerId}] job error ${queue} ${JSON.stringify(job)} >> ${error}`);
    })
    .on('pause', (workerId) => {
        //log(`worker[${workerId}] paused`);
    })
    .on('internalError', (error) => {
        log(error);
    })
    .on('multiWorkerAction', (verb, delay) => {
        //log(`*** checked for worker status: ${verb} (event loop delay: ${delay}ms)`);
    });

const worker = new Worker(
    { connection: connectionDetails, queues: 'default' },
    jobs
);
worker
    .on('start', (workerId) => {
        log(`worker[${workerId}] started`);
    })
    .on('end', (workerId) => {
        log(`worker[${workerId}] ended`);
    })
    .on('cleaning_worker', (workerId, worker, pid) => {
        log(`cleaning old worker ${worker} ${pid}`);
    })
    .on('poll', (workerId, queue) => {
        //log(`worker[${workerId}] polling ${queue}`);
    })
    .on('ping', (workerId, time) => {
        log(`worker[${workerId}] check in @ ${time}`);
    })
    .on('job', (workerId, queue, job) => {
        log(`worker[${workerId}] working job ${queue} ${JSON.stringify(job)}`);
    })
    .on('reEnqueue', (workerId, queue, job, plugin) => {
        log(`worker[${workerId}] reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`);
    })
    .on('success', (workerId, queue, job, result) => {
        log(`worker[${workerId}] job success ${queue} ${JSON.stringify(job)} >> ${result}`);
    })
    .on('failure', (workerId, queue, job, failure) => {
        log(job, failure)
        log(`worker[${workerId}] job failure ${queue} ${JSON.stringify(job)} >> ${failure}`);
    })
    .on('error', (workerId, queue, job, error) => {
        log(`worker[${workerId}] job error ${queue} ${JSON.stringify(job)} >> ${error}`);
    })
    .on('pause', (workerId) => {
        //log(`worker[${workerId}] paused`);
    })
    .on('internalError', (error) => {
        log(error);
    })
    .on('multiWorkerAction', (verb, delay) => {
        //log(`*** checked for worker status: ${verb} (event loop delay: ${delay}ms)`);
    })
    .connect();


class Scheduler extends SchedulerBase {
    start() {
        this.on("start", () => {
            log('scheduler started');
        }).on('end', () => {
            log('scheduler ended');
        }).on('poll', () => {
            log('scheduler polling');
        }).on('leader', () => {
            log('scheduler became leader');
        }).on('error', (error) => {
            log(`scheduler error >> ${error}`);
        }).on('cleanStuckWorker', (workerName, errorPayload, delta) => {
            log(
                `failing ${workerName} (stuck for ${delta}s) and failing job ${errorPayload}`
            );
        }).on('workingTimestamp', (timestamp) => {
            log(`scheduler working timestamp ${timestamp}`);
        }).on('transferredJob', (timestamp, job) => {
            log(`scheduler enquing job ${timestamp} >> ${JSON.stringify(job)}`);
        });
        this.connect().then(async () => {
            super.start();
        });
    }
}
const scheduler = new Scheduler({ connection: connectionDetails, leaderLockTimeout: 30 }, jobs);


class DefaultQueue extends Queue {
    enqueue(...args) {
        return super.enqueue('default', ...args);
    }

    del(...args) {
        return super.del('default', ...args);
    }

    queued(...args) {
        return super.queued('default', ...args);
    }

    async enqueueAt(timestamp, ...args) {
        try {
            return await super.enqueueAt(timestamp, 'default', ...args);
        } catch (e) {
            if (e.message != 'Job already enqueued at this time with same arguments') {
                throw e;
            }
        }
    }

    delDelayed(...args) {
        return super.delDelayed('default', ...args);
    }
}

const queue = new DefaultQueue({ connection: connectionDetails }, jobs);
queue
    .on('error', (error) => {
        log(error);
    })
    .connect();

module.exports.multiWorker = multiWorker;
module.exports.worker = worker;
module.exports.scheduler = scheduler;
module.exports.queue = queue;
module.exports.redis = redisClient;