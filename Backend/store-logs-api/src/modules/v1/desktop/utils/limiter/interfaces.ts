import { ReqLimitError } from './BasicError'

export interface IOptions {
    maxAttempts?: number;
    maxRepeatAttempts?: number;
    checkDelay?: number;
    maxOneTimeReq?: number;
    stdTTL?: number;
    minTTL?: number;
    checkperiod?: number;
    clientName?: string;
    limitErrorValidator?: (error: any) => boolean;
    ReqLimitError?: typeof ReqLimitError;
}

export interface ISetOptions {
    key: string;
    data: any;
    ttl?: number;
}