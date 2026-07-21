import { Controller, Post, Body, Req, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateClockInClockOutDTO } from './dto/update-clock.dto';
import { TimesheetService } from './timesheet.service';
import { GetClockInClockOutDTO } from './dto/get-clock.dto';

@ApiTags('Timesheet')
@ApiBearerAuth()
@Controller('timesheet')
export class TimesheetController {
    constructor(private readonly timeSheetService: TimesheetService) { }

    @Post('record-clock-in')
    @ApiOperation({ description: 'Insert User\'s clock-in/clock-out time OR break-time', summary: 'Done' })
    async updateClockInClockOutOrBreakTime(@Req() req, @Body() dataDto: UpdateClockInClockOutDTO): Promise<any> {
        return await this.timeSheetService.updateTimeSheet(req.user, dataDto);
    }


    @Post('clock-in')
    @ApiOperation({ description: 'Insert User\'s clock-in/clock-out time OR break-time', summary: 'Done' })
    async getClockInClockOutOrBreakTime(@Req() req, @Body() dataDto: GetClockInClockOutDTO): Promise<any> {
        return await this.timeSheetService.getTimeSheet(req.user, dataDto);
    }
}
