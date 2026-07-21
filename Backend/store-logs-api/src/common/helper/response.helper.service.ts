import { Injectable } from '@nestjs/common';
import { IResponse } from '../interfaces/response.interface';

@Injectable()
export class ResponseHelperService {
    sendResponse(statusCode: number, message: string, error: any, data: any): IResponse {
        return { statusCode, message, error, data };
    }
}
