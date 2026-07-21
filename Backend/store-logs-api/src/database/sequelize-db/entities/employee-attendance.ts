import { Column, Table, Model, DataType, Sequelize, HasMany } from 'sequelize-typescript';
import { EmployeeTimesheetEntity } from './employee-timesheet';

@Table({ tableName: 'employee_attendance', underscored: true })
export class EmployeeAttendanceEntity extends Model<EmployeeAttendanceEntity> {

    @Column({ type: DataType.BIGINT, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.BIGINT, allowNull: false })
    readonly employee_id: number;

    @Column({ type: DataType.BIGINT, allowNull: false })
    readonly organization_id: number;

    @Column({ type: DataType.DATEONLY, allowNull: false })
    readonly date: Date;

    @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
    readonly start_time: Date;

    @Column({ type: DataType.DATE, allowNull: true, defaultValue: null })
    readonly end_time: Date;

    @Column({ type: DataType.STRING, allowNull: true, defaultValue: null })
    readonly details: string;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly created_at: Date;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly updated_at: Date;

    @HasMany(() => EmployeeTimesheetEntity)
    empTimesheets: EmployeeTimesheetEntity
}