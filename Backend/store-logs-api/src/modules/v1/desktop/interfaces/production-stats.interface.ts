export interface IActivityUsageData {
    readonly logSheetId: string;
    readonly day: string;
    readonly loginTime: number;
    readonly userId: string;
    readonly logoutTime: string;
    readonly adminId: string;
    readonly workingHours: string;
    readonly nonWorkingHours: string;
    readonly total_hours: number;
    readonly tSec: number;
    readonly wSec: number;
    readonly nSec: number;
    readonly isReportGenerated: number;
}