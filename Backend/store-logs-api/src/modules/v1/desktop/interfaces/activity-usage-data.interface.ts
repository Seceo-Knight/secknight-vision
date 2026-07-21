export interface IActivityUsageData {
    readonly userId: number;
    readonly userEmail: string;
    readonly adminId: number;
    readonly timezone: string;  
    readonly dataId: string;
    readonly systemTimeUtc: string;
    readonly date: string;
    readonly time: string;
    readonly taskNote: string;
    readonly appVersion: string;
    readonly timestampInUtc: number;
    readonly timestampServer: number;
    readonly timestampActual: number;
    readonly projectId: number;
    readonly taskId: number;
    readonly breakInSeconds: number;
    readonly clicksCount: number;
    readonly fakeActivitiesCount: number;
    readonly keysCount: number;
    readonly movementsCount: number;
    readonly activityPerSecond: {
        buttonClicks: number[];
        fakeActivities: number[];
        keystrokes: number[];
        mouseMovements: number[];
    },
    readonly mode: {
        name: string;
        start: number;
        end: number;
    },
    readonly appUsage: {
        ageOfData: number;
        app: string;
        start: number;
        end: number;
        title: string;
        url: string;
        keystrokes: string;
    }[],
    readonly status: number;
    attendanceDate?: string;
    secondAttendanceDate?: string;
    systemTimeUtcDayOneEnd?: string;
}