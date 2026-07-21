import { ActivityService } from './service/activity.service';
import {
  Controller,
  Req,
  Body,
  Post,
  UseInterceptors,
  Get,
  UploadedFiles,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UsageActivityDataDTO } from './dto/usage-activity-data.dto';
import { SystemEventsDTO } from './dto/system-logs.dto';
import { ScreenshotService } from './service/screenshot.service';
import { ScreenRecordService } from './service/screen-record.service';
import { SystemLogsService } from './service/system-logs.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ScreenshotDTO } from './dto/screenshot.dto';
import { ScreenRecordDTO } from './dto/screen-record.dto';
import { UserFeatureService } from './service/user-feature.service';
import { UploadedFilesValidation } from './pipes/uploaded-files.validation';
import { imageFileFilter, videoFileFilter } from './utils/file.utils';
import { UploadDto } from './dto/upload.dto';

@ApiTags('Desktop')
@ApiBearerAuth()
@Controller('desktop')
export class DesktopController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly ssService: ScreenshotService,
    private readonly srService: ScreenRecordService,
    private readonly featureService: UserFeatureService,
    private readonly systemLogsService: SystemLogsService,
  ) { }

  @Post('add-activity-log')
  @ApiOperation({ description: 'Insert app usage and user activity', summary: 'Done' })
  async insertUsageActivityData(@Req() req, @Body() usageActivityDto: UsageActivityDataDTO): Promise<any> {
    // return await this.activityService.insertUsageDataHandler(req.user, usageActivityDto, req.headers.authorization ? req.headers.authorization : null);
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    ip = ip.replace(",35.201.73.5", "")
    return await this.activityService.insertUsageDataHandler(req.user, usageActivityDto, req.headers["user-agent"], ip);
  }

  @Post('add-system-log')
  @ApiOperation({ description: 'Insert app system events logs', summary: 'Done' })
  async insertSystemEventsData(@Req() req, @Body() systemLogsDto: SystemEventsDTO): Promise<any> {
    return await this.systemLogsService.addSystemLog(req.user, systemLogsDto);
  }

  @Post('upload-screenshots')
  @UseInterceptors(
    FilesInterceptor('screenshots', 50, {
      fileFilter: imageFileFilter
    }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ description: 'It will upload screenshot to specific storage', summary: 'Initial' })
  @ApiBody({ description: 'Files to upload (Swagger only supports single file upload. But API is capable of handling several files in one req)', type: ScreenshotDTO, isArray: true })
  async uploadScreenShots(
    @UploadedFiles() files: UploadDto[],
    @Req() req,
    @Body(new ValidationPipe({ transform: true }), UploadedFilesValidation) ssData: ScreenshotDTO
  ): Promise<any> {
    return await this.ssService.upload(files, req.user, ssData);
  }

  @Post('upload-screen-records')
  @UseInterceptors(
    FilesInterceptor('screenRecords', 12, {
      fileFilter: videoFileFilter,
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    description: 'It will upload screen record to specific storage',
    summary: 'Initial',
  })
  @ApiBody({
    description:
      'Files to upload (Swagger only supports single file upload. But API is capable of handling several files in one req)',
    type: ScreenRecordDTO,
    isArray: true,
  })
  async uploadScreenRecord(
    @UploadedFiles() files: UploadDto[],
    @Req() req,
    @Body(new ValidationPipe({ transform: true }), UploadedFilesValidation)
    srData: ScreenRecordDTO,
  ): Promise<any> {
    return await this.srService.upload(files, req.user, srData);
  }

  @Get('feature-status')
  @ApiOperation({ description: 'It is for feature status. Either on or off', summary: 'Initial' })
  async fetchFeature(): Promise<any> {
    return await this.featureService.fetchFeature();
  }
}
