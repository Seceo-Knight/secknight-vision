export class ReqLimitError extends Error {
    statusCode: number;
    constructor() {
        super();
        this.name = 'RATE_LIMIT_EXCEEDED';
        this.message = 'Sorry, Due to high Requests, Limit is exceeded. Please, try again after some time.';
        this.statusCode = 403;
    }
}

export const validate = (error) => error.errors && error.errors[0]?.domain === 'usageLimits';