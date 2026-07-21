import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { IResponse } from './common/interfaces/response.interface';

@ApiTags('Default')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): IResponse {
    return this.appService.getHello();
  }
}
