import { IActivityUsageData } from "./activity-usage-data.interface";

export interface IActivityRequestData {
    readonly sign: string;
    readonly data: IActivityUsageData[];
}

export interface ILogSessions {
    readonly id: string;
    readonly startTime: string;
    readonly activeSeconds: number;
    readonly endTime: string;
    readonly dataSubmitted: boolean;
}