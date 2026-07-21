export interface ISystemEvent {
  readonly title: string;
  readonly duration: number;
  readonly start: Date;
  readonly end: Date;
  readonly date: string;
  readonly type?: string;
  readonly description?: string;
}

export interface ISystemLog {
  readonly organization_id: number;
  readonly employee_id: number;
  readonly computer: string;
  readonly title: string;
  readonly duration: number;
  readonly start: Date;
  readonly end: Date;
  readonly date: string;
  readonly type?: string;
  readonly description?: string;
}
