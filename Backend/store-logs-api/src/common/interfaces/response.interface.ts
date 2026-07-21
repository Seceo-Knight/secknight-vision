export interface IResponse {
    readonly statusCode: number;
    readonly message: string;
    readonly error: any;
    readonly data: any;
}
