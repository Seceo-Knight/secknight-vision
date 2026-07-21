import { Injectable, NotAcceptableException } from '@nestjs/common';
import { IDecodedToken } from '../../../common/interfaces/decoded-token.interface';
import { UpdateClockInClockOutDTO } from './dto/update-clock.dto';
import { EmployeeAttendanceModel } from 'src/database/sequelize-db/models/employee-attendance.model';
import { EmployeeTimesheetModel } from 'src/database/sequelize-db/models/employee-timesheet.model';
import { ResponseHelperService } from 'src/common/helper/response.helper.service';
import { GetClockInClockOutDTO } from './dto/get-clock.dto';
import { validateClickInClickOutSchema, validateTimesheetSchema } from './validation/click-in-click-out.validation';
import moment = require('moment-timezone');

@Injectable()
export class TimesheetService {
    constructor(
        private readonly empAttendanceModel: EmployeeAttendanceModel,
        private readonly empTimesheetModel: EmployeeTimesheetModel,
        private readonly respService: ResponseHelperService
    ) { }

    async updateTimeSheet(user: IDecodedToken, dataDto: UpdateClockInClockOutDTO): Promise<any> {
        try {
            if (process.env.ENABLE_VALIDATION === 'true') {
                try {
                    dataDto = await validateTimesheetSchema.validateAsync(dataDto);
                } catch (error) {
                    throw new NotAcceptableException(error.details[0].message);
                }
            }

            const employeeId = user.employee_id || user.id;
            const organizationId = user.organization_id || user.admin_id;

            if (employeeId) {

                if (dataDto.data.constructor === Array && dataDto.data.length > 0) {

                    let success = true;

                    for (let i = 0; i < dataDto.data.length; i++) {
                        let { startDate, endDate }: any = dataDto.data[i];
                        const { type, mode }: any = dataDto.data[i];
                        startDate = moment(startDate);
                        endDate = moment(endDate);
                        const duration = moment.duration(endDate.diff(startDate)).asSeconds();

                        let [attendanceData] = await this.empAttendanceModel.getUserAttendanceIdOnSingleDayElseCreate(
                            startDate.format('YYYY-MM-DD'), employeeId, organizationId,
                            startDate.format('YYYY-MM-DD HH:mm:ss'),
                            endDate.format('YYYY-MM-DD HH:mm:ss')
                        );
                        attendanceData = attendanceData.get({ plain: true });
                        if (attendanceData) {
                            const curAttendanceId = attendanceData.id;
                            const curStartDate = startDate.format('YYYY-MM-DD HH:mm:ss');

                            // find
                            const dbTimeSheetData = await this.empTimesheetModel.findOne(curAttendanceId, curStartDate, type, mode);

                            if (dbTimeSheetData) { // update
                                await dbTimeSheetData.update({ end_time: endDate.format('YYYY-MM-DD HH:mm:ss'), duration: duration });
                            } else { // insert
                                let timesheetEntryData = await this.empTimesheetModel.create(
                                    attendanceData.id,
                                    startDate.format('YYYY-MM-DD HH:mm:ss'),
                                    endDate.format('YYYY-MM-DD HH:mm:ss'),
                                    type, mode, duration
                                );
                                timesheetEntryData = timesheetEntryData.toJSON();
                            }
                        } else {
                            success = false;
                            break;
                        }
                    }

                    if (success === true)
                        return this.respService.sendResponse(200, 'ClockIn/ClockOut data recorded', null, { status: 'updated' });
                    else
                        return this.respService.sendResponse(400, 'Error in Attendance', 'Some error occured while upserting attendance id', null);

                } else {
                    throw new NotAcceptableException('Data should be passed in array');
                }
            } else {
                return this.respService.sendResponse(400, 'EmployeeId is missing', 'Token does not contain employee id', null);
            }
        } catch (error) {
            return this.respService.sendResponse(400, 'Error', error, null);
        }
    }

    async getTimeSheet(user: IDecodedToken, dataDto: GetClockInClockOutDTO): Promise<any> {
        try {
            if (process.env.ENABLE_VALIDATION === 'true') {
                try {
                    dataDto = await validateClickInClickOutSchema.validateAsync(dataDto);
                } catch (error) {
                    throw new NotAcceptableException(error.details[0].message);
                }
            }

            const startDate = moment(dataDto.startDate).format('YYYY-MM-DD');
            const endDate = moment(dataDto.endDate).format('YYYY-MM-DD');
            const employeeId = user.employee_id || user.id;

            if (employeeId) {
                let fetchedList = await this.empAttendanceModel.getUserAttendanceDayWiseWithTimesheetData(startDate, endDate, employeeId);
                fetchedList = fetchedList.filter((item: { empTimesheets: { id: any; }; }) => item.empTimesheets.id !== null);

                if (fetchedList.length === 0)
                    return this.respService.sendResponse(404, 'No data found', { count: 0, clockInList: fetchedList }, null);
                else
                    return this.respService.sendResponse(200, 'ClockIn/ClockOut data found', null, { count: fetchedList.length, clockInList: fetchedList });
            } else {
                return this.respService.sendResponse(400, 'EmployeeId is missing', 'Token does not contain employee id', null);
            }
        } catch (error) {
            return this.respService.sendResponse(400, 'Error', error, null);
        }
    }

    // async  updateTimeSheet(user: IDecodedToken, dataDto: UpdateClockInClockOutDTO): Promise<any> {
    //     try {
    //         if (process.env.ENABLE_VALIDATION === 'true') {
    //             try {
    //                 dataDto = await validateTimesheetSchema.validateAsync(dataDto);
    //             } catch (error) {
    //                 throw new NotAcceptableException(error.details[0].message);
    //             }
    //         }

    //         // eslint-disable-next-line prefer-const
    //         let { startDate, endDate, type, duration }: any = dataDto;
    //         startDate = moment(startDate);
    //         endDate = moment(endDate);

    //         const employeeId = user.employee_id || user.id;
    //         const organizationId = user.organization_id || user.admin_id;

    //         if (employeeId) {
    //             let [attendanceData, created] = await this.empAttendanceModel.getUserAttendanceIdOnSingleDayElseCreate(
    //                 startDate.format('YYYY-MM-DD'), employeeId, organizationId,
    //                 startDate.format('YYYY-MM-DD HH:mm:ss'),
    //                 endDate.format('YYYY-MM-DD HH:mm:ss')
    //             );
    //             attendanceData = attendanceData.get({ plain: true });

    //             if (!attendanceData) {
    //                 return this.respService.sendResponse(400, 'Error in Attendance', 'Some error occured while upserting attendance id', null);
    //             } else {
    //                 let timesheetEntryData = await this.empTimesheetModel.create(
    //                     attendanceData.id,
    //                     startDate.format('YYYY-MM-DD HH:mm:ss'),
    //                     endDate.format('YYYY-MM-DD HH:mm:ss'),
    //                     type, duration
    //                 );
    //                 timesheetEntryData = timesheetEntryData.toJSON();
    //                 return this.respService.sendResponse(200, 'ClockIn/ClockOut data recorded', null, { status: timesheetEntryData.id });
    //             }
    //         } else {
    //             return this.respService.sendResponse(400, 'EmployeeId is missing', 'Token does not contain employee id', null);
    //         }
    //     } catch (error) {
    //         return this.respService.sendResponse(400, 'Error', error, null);
    //     }
    // }
}