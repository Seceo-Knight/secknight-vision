export interface IDecodedToken {
    readonly id?: number;
    readonly employee_id?: number;
    readonly organization_id?: number;
    readonly admin_id?: number;
    readonly email: string;
    readonly name: string;
    readonly ip: string;
    readonly timezone: string;
    readonly logoutOptions: {
        option: number,
        specificTimeUTC: string,
        specificTimeUser: string,
        afterFixedHours: number
    };
    // readonly trackingMode: string;
    readonly setting?: {
        trackingMode: string,
        tracking?: {
            fixed?: string
        },
        timesheetIdleTime?: string,
        screen_record?: {
            is_enabled: number
        };
    };
    shift?: string;
    readonly productivityCategory?: number;
    readonly first_name: string;
    readonly last_name: string;
}