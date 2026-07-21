import { EmployeeTimesheetModel } from './models/employee-timesheet.model';
import { Module } from '@nestjs/common';
import { sequelizeDbProviders } from './providers/sequelize-db.provider';
import { sequelizeRepoProviders } from './providers/sequelize-repo.providers';
import { ConfigModule } from '@nestjs/config';
import { EmployeeAttendanceModel } from './models/employee-attendance.model';
import { IntegrationModel } from './models/integraion.model';
import { ProductionStatsModel } from './models/production-stats.model';

const exportsOnly = [EmployeeTimesheetModel, EmployeeAttendanceModel, IntegrationModel, ProductionStatsModel];

const providersOnly = [sequelizeDbProviders, ...sequelizeRepoProviders, ...exportsOnly];
@Module({
    imports: [ConfigModule.forRoot()],
    providers: [...providersOnly],
    exports: exportsOnly
})
export class SequelizeDbModule { }