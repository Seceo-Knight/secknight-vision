export interface IClockInClockOut {
    readonly type: number;
    readonly mode: number;
    readonly startDate: Date;
    readonly endDate: Date;
}

export interface IClockInClockOutData {
    data: IClockInClockOut[]
}