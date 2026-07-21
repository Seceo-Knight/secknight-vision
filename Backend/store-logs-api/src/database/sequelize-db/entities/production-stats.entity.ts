import { Column, Table, Model, DataType, Sequelize } from 'sequelize-typescript';

@Table({ tableName: 'production_stats', underscored: true })
export class ProductionStatsEntity extends Model<ProductionStatsEntity> {

    @Column({ type: DataType.BIGINT, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.CHAR })
    readonly log_sheet_id: string;

    @Column({ type: DataType.CHAR })
    readonly day: string;

    @Column({ type: DataType.DATE })
    readonly login_time: Date;

    @Column({ type: DataType.DATE })
    readonly logout_time: Date;

    @Column({ type: DataType.BIGINT })
    readonly user_id: number;

    @Column({ type: DataType.BIGINT })
    readonly admin_id: number;

    @Column({ type: DataType.CHAR })
    readonly working_hours: string;

    @Column({ type: DataType.CHAR })
    readonly non_working_hours: string;

    @Column({ type: DataType.CHAR })
    readonly total_hours: string;

    @Column({ type: DataType.INTEGER })
    readonly t_sec: number;

    @Column({ type: DataType.INTEGER })
    readonly w_sec: number;

    @Column({ type: DataType.INTEGER })
    readonly n_sec: number;

    @Column({ type: DataType.INTEGER })
    readonly is_report_generated: number;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly created_at: Date;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly updated_at: Date;
}