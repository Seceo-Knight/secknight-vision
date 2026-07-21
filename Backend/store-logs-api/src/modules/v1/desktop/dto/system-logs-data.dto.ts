import { ApiProperty } from "@nestjs/swagger";

export class SystemEventsDataDTO {
    @ApiProperty({
        description: `"dataId" is unique string which consists of date and time.<br />
        This is used for uniquely identifying the api call after each specified interval.`,
        required: true, type: 'string', default: null, example: `2020-04-04T10:30:00Z`,
    })
    readonly dataId: string;

    @ApiProperty({
        description: '"device" is used to determine from what platform the api is being called and the interval ',
        required: true,
        type: 'object',
        nullable: false,
        properties: {
            name: { type: 'string', default: 'computer', example: 'computer', description: 'From where the api is being called.' },
            start: { type: 'number', nullable: false, example: 0, default: 0 },
            end: { type: 'number', example: 300, description: '"end" - "start" = number of seconds between the api calls, here after every 5minutes teh api is will be called conataining only that 5 minutes of data (if last event have end < mode.end, this diff will be saved as `Passive`)' },
        }
    })
    readonly device: {
        name: string;
        start: number;
        end: number;
    };

    @ApiProperty({
        description: `"Events" is the data of a user\'s particular events.<br />
        It is an array of json object having all the data of events emmited during specified interval. It has following key:value pairs:<br />
        title, type, start, end, description`,
        required: true,
        type: 'array',
        default: [],
        items: {
            properties: {
                title: { type: 'string', nullable: false, example: 'Program Manager', description: 'It\'s the event name or app, that used in this moment, like Program Manager, Fiddler,etc. Also case-sensitive.' },
                type: { type: 'string', nullable: false, example: 'explorer.exe', description: 'Event type or Software that launches the application' },
                start: { type: 'number', nullable: false, example: 47, description: 'It\'s the second the app starts from the last api call. (suppose the last api call was 10:03:00 and the app start at 10:04:59 then the start will be 0 and the end will be 119)' },
                end: { type: 'number', nullable: false, example: 72, description: 'It\'s the time when the app stops.' },
                description: { type: 'string', nullable: false, example: "Windows Explorer", description: 'Event or application description' }
            }

        },
        example: [
            { title: "Activtrac Service started", start: 0, end: 123, type: "System Event", description: "Ver: 8.1.9.0" },
            { title: "Program Manager", start: 123, end: 256, type: "explorer.exe", description: "Windows Explorer" },
        ]

    })
    readonly events: {
        title: string;
        start: number;
        end: number;
        type: string;
        description: string;
    }[];

}