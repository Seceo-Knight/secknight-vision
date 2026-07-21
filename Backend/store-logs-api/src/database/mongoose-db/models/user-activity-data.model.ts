import { IActivityUsageData } from './../../../modules/v1/desktop/interfaces/activity-usage-data.interface';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
// import moment = require('moment-timezone');

@Injectable()
export class UserActivityDataMongoModel {
    constructor(@InjectModel('UserActivityData') private readonly collection: Model<any>) { }

    async getAll() {
        return await this.collection.find().exec();
    }

    async getOnlyIdBasedOnDataIdAndUserIdAndAdminId(userId: number, adminId: number, dataId: string) {

        // const fiveMinLessThancurrentTimestamp = Number(moment().utc().subtract('5', 'minutes').format('X'));
        return await this.collection.findOne({
            userId, dataId
            // timestampInUtc: {
            //     $gte: fiveMinLessThancurrentTimestamp,
            //     $lt: timestampInUtc
            // }
        }, { _id: 1, dataId: 1, mode: 1 }).lean().exec();
    }

    async insert(activityData: IActivityUsageData[]): Promise<any> {
        const newActivityData = await this.collection.insertMany(activityData);
        return newActivityData;
    }
}
