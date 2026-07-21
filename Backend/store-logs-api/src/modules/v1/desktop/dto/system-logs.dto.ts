import { ApiProperty } from "@nestjs/swagger";

export class SystemEventsDTO {
    @ApiProperty({
        description: `"Events" is the data of a user\'s particular events.<br />
        It is an array of json object having all the data of events emmited during specified interval. It has following key:value pairs:<br />
        title, type, start, end, description`,
        required: true,
        type: 'array',
        default: [],
        items: {
            properties: {
                dataId: { type: 'string', nullable: false, example: `2020-04-04T10:30:00Z`, description: `"dataId" is unique string which consists of date and time.<br /> This is used for uniquely identifying the api call after each specified interval.` },
                title: { type: 'string', nullable: false, example: 'Program Manager', description: 'It\'s the event name or app, that used in this moment, like Program Manager, Fiddler,etc. Also case-sensitive.' },
                type: { type: 'string', nullable: false, example: 'explorer.exe', description: 'Event type or Software that launches the application' },
                // start: { type: 'number', nullable: false, example: 47, description: 'It\'s the second the app starts from the last api call. (suppose the last api call was 10:03:00 and the app start at 10:04:59 then the start will be 0 and the end will be 119)' },
                // end: { type: 'number', nullable: false, example: 72, description: 'It\'s the time when the app stops.' },
                computer: { type: 'string', nullable: false, example: "ABC", description: 'Name of computer' },
                description: { type: 'string', nullable: false, example: "Windows Explorer", description: 'Event or application description' }
            }

        },
        example: [
            { dataId: `2020-04-04T10:30:00Z`, title: "Activtrac Service started", type: "System Event", description: "Ver: 8.1.9.0", computer: "ABC" },
            { dataId: `2020-04-04T10:30:00Z`, title: "Program Manager", type: "explorer.exe", description: "Windows Explorer", computer: "ABC" },
        ]

    })
    readonly events: {
        dataId: string;
        title: string;
        type: string;
        computer: string;
        description: string;
    }[];

}

