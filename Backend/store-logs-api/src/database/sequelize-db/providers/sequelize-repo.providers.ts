import { mysqlConstants } from './sequelize-db.constants';
import { EmployeeTimesheetEntity } from '../entities/employee-timesheet';
import { EmployeeAttendanceEntity } from '../entities/employee-attendance';
import { IntegrationsEntity } from '../entities/integrations';
import { ProvidersEntity } from '../entities/providers';
import { OrganizationProvidersEntity } from '../entities/organization-providers';
import { OrganizationProvidersCredentialsEntity } from '../entities/organization-providers-credentials';
import { ProductionStatsEntity } from '../entities/production-stats.entity';

export const sequelizeRepoProviders = [
    { provide: mysqlConstants.employeeTimesheetRepo, useValue: EmployeeTimesheetEntity },
    { provide: mysqlConstants.employeeAttendanceRepo, useValue: EmployeeAttendanceEntity },
    { provide: mysqlConstants.integrationRepo, useValue: IntegrationsEntity },
    { provide: mysqlConstants.providersRepo, useValue: ProvidersEntity },
    { provide: mysqlConstants.organizationProvidersRepo, useValue: OrganizationProvidersEntity },
    { provide: mysqlConstants.organizationProvidersCredentialsRepo, useValue: OrganizationProvidersCredentialsEntity },
    { provide: mysqlConstants.productionStatsRepo, useValue: ProductionStatsEntity }
];