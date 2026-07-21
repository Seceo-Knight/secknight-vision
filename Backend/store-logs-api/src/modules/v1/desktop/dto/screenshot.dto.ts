import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ScreenshotDTO {
    @ApiProperty({
        type: 'string', format: 'binary', required: true,
        description: 'Please make every screenshot name as the DateObject when it was taken. (format:`HH-YYYY-MM-DD HH-mm-ss-sc0.ext`, example:`13-2020-04-23 13-55-07-sc0.jpg`)'
    })
    screenshots: any[];

    @ApiProperty({ type: 'number', default: 0, example: 21, description: 'Project Id related to screenshot' })
    @Type(() => Number)
    @IsInt()
    @Min(-1)
    projectId: number = 0;

    @ApiProperty({ type: 'number', default: 0, example: 10, description: 'Task Id related to screenshot' })
    @Type(() => Number)
    @IsInt()
    @Min(-1)
    taskId: number = 0;
}
