import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { RouterModule, Routes } from 'nest-router';
import { HelperModule } from './common/helper/helper.module';
import { MongooseDBModule } from './database/mongoose-db/mongoose-db.module';
import { AuthModule } from './modules/v1/auth/auth.module';
import { DesktopModule } from './modules/v1/desktop/desktop.module';
import { AuthMiddleware } from './modules/v1/auth/auth.middleware';
import { TimesheetModule } from './modules/v1/timesheet/timesheet.module';

const routes: Routes = [{ path: 'v1', children: [DesktopModule, TimesheetModule] }];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseDBModule,
    HelperModule, AuthModule,
    DesktopModule,
    TimesheetModule,
    RouterModule.forRoutes(routes)
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes('/v1');
    // consumer.apply(AuthMiddleware).forRoutes('/v1/timesheet');
  }
}
