import { ApiProperty } from "@nestjs/swagger";

export class GetClockInClockOutDTO {
    @ApiProperty({ type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock starts / break starts' })
    startDate: Date;

    @ApiProperty({ type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock ends / break ends' })
    endDate: Date;
}