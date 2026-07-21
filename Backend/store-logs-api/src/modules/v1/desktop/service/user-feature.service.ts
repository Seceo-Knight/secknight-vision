import { IResponse } from '../../../../common/interfaces/response.interface';
import { Injectable } from '@nestjs/common';
import { ResponseHelperService } from 'src/common/helper/response.helper.service';

@Injectable()
export class UserFeatureService {
    constructor(
        private readonly responseHelperService: ResponseHelperService
    ) { }

    async fetchFeature(): Promise<IResponse> {
        return this.responseHelperService.sendResponse(200, 'Status fetched', null, {
            system: {
                type: 'personal',
                visibility: false,
                info: { type: 'personal or office', visibility: 'true-visible mode , false-stealth mode' }
            },
            screenshot: {
                frequencyPerHour: 30,
                employeeAccessibility: false,
                employeeCanDelete: false
            },
            breakInMinute: 30,
            idleInMinute: 2,
            trackingMode: 'unlimited',
            tracking: {
                unlimited: {
                    day: '1,2,3,4,5,6,7',
                    info: { day: '1-monday,7-sunday', time: 'all day' }
                },
                fixed: {
                    mon: {
                        status: true,
                        time: { start: '10:00', end: '19:00' }
                    },
                    tue: {
                        status: true,
                        time: { start: '10:00', end: '19:00' }
                    },
                    wed: {
                        status: false,
                        time: { start: '10:00', end: '19:00' }
                    },
                    thu: {
                        status: true,
                        time: { start: '10:00', end: '19:00' }
                    },
                    fri: {
                        status: true,
                        time: { start: '10:00', end: '19:00' }
                    },
                    sat: {
                        status: true,
                        time: { start: '10:00', end: '15:00' }
                    },
                    sun: {
                        status: false,
                        time: { start: '10:00', end: '19:00' }
                    },
                    info: { day: '1-monday,7-sunday', time: 'fixed, else dont track', status: 'true means track else no tracking that day' }

                },
                networkBased: {
                    networkName: 'Globussoft',
                    networkMac: '00-14-22-01-23-45',
                    info: {
                        other: 'only track when system in on particular network',
                    }
                },
                manual: {
                    info: {
                        other: 'when user will start tracking clock-in and stops when clock-out',
                    }
                },
                projectBased: {
                    info: {
                        other: 'when user will start working on a project',
                    }
                }
            },
            task: {
                employeeCanCreateTask: true,
                info: {
                    employeeCanCreateTask: 'either true or false',
                }
            }
        });
    }
}