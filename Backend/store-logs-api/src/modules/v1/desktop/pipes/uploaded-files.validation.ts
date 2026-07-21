import { PipeTransform } from '@nestjs/common';
import { ScreenshotDTO } from '../dto/screenshot.dto';
import { ScreenRecordDTO } from '../dto/screen-record.dto';

export class UploadedFilesValidation implements PipeTransform {
    transform(value: ScreenshotDTO): ScreenshotDTO | ScreenRecordDTO{
        if (value.projectId === -1) value.projectId = 0;
        if (value.taskId === -1) value.taskId = 0;
        return value
    }
}
