import { Column, DataType, Table, Model, Sequelize, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { EmployeeAttendanceEntity } from './employee-attendance';

@Table({ tableName: 'employee_timesheet', underscored: true })
export class EmployeeTimesheetEntity extends Model<EmployeeTimesheetEntity> {

    @Column({ type: DataType.BIGINT, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.BIGINT, allowNull: true, defaultValue: null })
    @ForeignKey(() => EmployeeAttendanceEntity)
    readonly attendance_id: number;

    @Column({ type: DataType.TIME, allowNull: true, defaultValue: null })
    readonly start_time: Date;

    @Column({ type: DataType.TIME, allowNull: true, defaultValue: null })
    readonly end_time: Date;

    @Column({ type: DataType.TINYINT, defaultValue: 1, allowNull: true, comment: '1:Clock,2:Break' })
    readonly type: number;

    @Column({ type: DataType.TINYINT, defaultValue: 1, allowNull: true, comment: '1:Auto,2:Manual' })
    readonly mode: number;

    @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 0 })
    readonly duration: number;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly created_at: Date;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly updated_at: Date;

    @BelongsTo(() => EmployeeAttendanceEntity)
    empAttendance: EmployeeAttendanceEntity
}