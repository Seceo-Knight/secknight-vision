// import { IActivityUsageData } from './../../../modules/v1/desktop/interfaces/activity-usage-data.interface';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import moment = require('moment-timezone');

@Injectable()
export class UserSystemLogsMongoModel {
  constructor(
    @InjectModel('UserSystemLogs') private readonly collection: Model<any>,
  ) {}

  findLastInserted(organization_id, employee_id, date) {
    return this.collection
      .find({
        organization_id,
        employee_id,
        date: { $gte: date },
      })
      .exec();
  }

  insert(systemLogsData): Promise<any> {
    return this.collection.insertMany(systemLogsData);
  }

  updateLastLog(_id, duration, end) {
    return this.collection.updateOne({ _id }, { duration, end });
  }
}
