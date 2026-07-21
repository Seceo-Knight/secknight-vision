import { Module } from '@nestjs/common';
import { TimesheetController } from './timesheet.controller';
import { TimesheetService } from './timesheet.service';
import { ConfigModule } from '@nestjs/config';
import { SequelizeDbModule } from 'src/database/sequelize-db/sequelize-db.module';
import { HelperModule } from 'src/common/helper/helper.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeDbModule,
    HelperModule
  ],
  controllers: [TimesheetController],
  providers: [TimesheetService]
})
export class TimesheetModule { }
