import { ApiProperty } from "@nestjs/swagger";
import { IActivityUsageData } from "../interfaces/activity-usage-data.interface";
import { IActivityRequestData } from "../interfaces/activity-request.interface";

export class UsageActivityDataDTO implements IActivityRequestData {
    @ApiProperty({
        description: `"sign" is unique string which consists of date and userId separted by _.<br />
        This is used for uniquely identifying the api call after each specified interval.`,
        required: true, type: 'string', default: null, example: `zxzsafewu9shbduyag67d5437r2udui:wery7we7rtw67ter76we`,
    })
    readonly sign: string;

    @ApiProperty({
        description: `"data" is the array of all the data for the session.<br />
        It is an array of json object having all the data of entire session in specified interval.`,
        required: true,
        type: 'array',
        default: [],
        items: {
            properties: {
                dataId: {
                    description: `"dataId" is unique string which consists of date and time.<br />
                    This is used for uniquely identifying the api call after each specified interval.`,
                    type: 'string', default: null, example: `2020-04-04T10:30:00Z`,
                },
                systemTimeUtc: {
                    description: `"systemTimeUtc" is unique string which consists of date and time.<br />
                    This is used for checking the difference between system time and server time irrespective of dataId`,
                    type: 'string', default: null, example: `2020-04-04T10:30:00Z`,
                },
                projectId: {
                    description: 'It is the project id of the user', type: 'number', default: 0, example: 11
                },
                taskId: {
                    description: 'Its the task id', type: 'number', default: 0, example: 3
                },
                taskNote: {
                    description: `"taskNote" is string that contains the custom test fro the task.`, type: 'string',
                    default: null, example: `Some custom text here`,
                },
                breakInSeconds: {
                    description: 'Its is number of seconds, user has taken break. Can be 0.', type: 'number', default: 0,
                    example: 300
                },
                clicksCount: {
                    description: 'It is the number of user\'s mouse button clicked during particular interval of time',
                    type: 'number', default: 0, example: 14
                },
                fakeActivitiesCount: {
                    description: 'It is the number of user\'s does a fake activity during particular interval of time',
                    type: 'number', default: 0, example: 3
                },
                keysCount: {
                    description: 'It is the number of user\'s key press during particular interval of time',
                    type: 'number', default: 0, example: 336
                },
                movementsCount: {
                    description: 'It is the number of user\'s mouse movements during particular interval of time',
                    type: 'number', default: 0, example: 44
                },
                activityPerSecond: {
                    description: `It cantains all the information of the user activity per second. Ex: <br />
                    Suppose the app is capturing and sending data in 5min interval, ie 300seconds. <br />
                    So each key will have 300 characters with 0 if nothing done at that very second <br /> 
                    else non zero, ie some positive number. <br />
                    <br />
                    Note: when the digits are added it will be equal to their count respectively. <br />
                    ex: "clicksCount" = summation of all digits in "buttonClicks" and so on.. `,
                    type: 'object',
                    nullable: false,
                    properties: {
                        buttonClicks: {
                            type: 'array',
                            nullable: false,
                            example: '000707000'.split(''),
                            description: 'Whenever user did not click on mouse button, its 0 for that second else number indicates the no. of click done in that second'
                        },
                        fakeActivities: {
                            type: 'array',
                            nullable: false,
                            example: '030000000'.split(''),
                            description: 'User did some fake activities at perticualr second,ie 2nd second, 3 times'
                        },
                        keystrokes: {
                            type: 'array',
                            nullable: false,
                            example: '173056847'.split(''),
                            description: '+number denotes User press this many keys every seconds else 0'
                        },
                        mouseMovements: {
                            type: 'array',
                            nullable: false,
                            example: '344200030'.split(''),
                            description: '+number denotes user did that many mouse event in particular second,else 0 id mouse is idle'
                        },
                    }
                },
                mode: {
                    description: '"mode" is used to determine from what platform the api is being called and the interval ',
                    type: 'object',
                    nullable: false,
                    properties: {
                        name: { type: 'string', default: 'computer', example: 'computer', description: 'From where the api is being called.' },
                        start: { type: 'number', nullable: false, example: 0, default: 0 },
                        end: { type: 'number', example: 300, description: '"end" - "start" = number of seconds between the api calls, here after every 5minutes teh api is will be called conataining only that 5 minutes of data' },
                    }
                },
                appUsage: {
                    description: `"appUsage" is the data of a user\'s activity on a partcular application.<br />
                    It is an array of json object having all the data of application used during specified interval. It has following key:value pairs:<br />
                    ageOfData, app, start, end, title and url`,
                    type: 'array',
                    default: [],
                    items: {
                        properties: {
                            ageOfData: { type: 'number', default: -1, example: -1, description: 'It will be default -1 always.' },
                            app: { type: 'string', nullable: false, example: 'AnyDesk', description: 'It\'s the app name, like Google Chrome,Fiddler,etc. Also case-sensitive.' },
                            title: { type: 'string', nullable: false, example: '12345678 - AnyDesk', description: 'Window Title, can be same for applications but different in case of browser. For browser it wil TAB Title.' },
                            url: { type: 'string', nullable: true, default: null, description: 'For applicaltion, it will be null and for browser it will be the TAB URL.' },
                            start: { type: 'number', nullable: false, example: 47, description: 'It\'s the second the app starts from the last api call. (suppose the last api call was 10:03:00 and the app start at 10:04:59 then the start will be 0 and the end will be 119)' },
                            end: { type: 'number', nullable: false, example: 72, description: 'It\'s the time when the app stops.' },
                            keystrokes: { type: 'string', nullable: false, example: "abcdefgh", description: 'It\'s the keystokes used within a app' }
                        }
                    },
                    example: [
                        { ageOfData: -1, app: "AnyDesk", start: 0, end: 123, title: "12345678 - AnyDesk", url: null, keystrokes: 'asdasdsad' },
                        { ageOfData: -1, app: "Google Chrome", start: 123, end: 256, title: "JSON Editor Online - view, edit", url: "https://jsoneditoronline.org", keystrokes: 'qweqwretw' }
                    ]
                }
            }
        }
    })
    readonly data: IActivityUsageData[];
}