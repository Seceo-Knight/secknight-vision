import { Injectable } from '@nestjs/common';
import { IResponse } from './common/interfaces/response.interface';
import { ResponseHelperService } from './common/helper/response.helper.service';

@Injectable()
export class AppService {
  constructor(private readonly responseHelperService: ResponseHelperService) { }
  getHello(): IResponse {
    return this.responseHelperService.sendResponse(200, 'Everything is perfect', null, null);
  }
}
