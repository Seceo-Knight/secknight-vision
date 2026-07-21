import { ApiProperty } from "@nestjs/swagger";
import { IClockInClockOutData, IClockInClockOut } from './../interfaces/clock-interface';

export class UpdateClockInClockOutDTO implements IClockInClockOutData {
    @ApiProperty({
        description: `"data" is the array of all the data for the session.<br />
            It is an array of json object having all the data of clock-in clock-out`,
        required: true,
        type: 'array',
        default: [],
        items: {
            properties: {
                type: {
                    type: 'number', default: 1, example: 1, description: '1 is for ClockIn/ClockOut <br /> 2 is for Break taken', enum: [1, 2]
                },
                mode: {
                    type: 'number', default: 1, example: 1, description: '1 - <br /> 2 - Manual', enum: [1, 2]
                },
                startDate: {
                    type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock starts / break starts'
                },
                endDate: {
                    type: 'string', default: null, example: new Date().toISOString(), description: 'When the clock ends / break ends'
                }
            },
            // example: {
            //     { type: 1, startDate: new Date().toISOString(), endDate: new Date().toISOString() },
            //     { type: 2, startDate: new Date().toISOString(), endDate: new Date().toISOString() }
            // ]
        }
    })
    readonly data: IClockInClockOut[];
}