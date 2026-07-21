import { Column, Table, DataType, HasMany, Model } from 'sequelize-typescript';
import { ProvidersEntity } from './providers';

@Table({ tableName: 'integrations', underscored: true })
export class IntegrationsEntity extends Model<ProvidersEntity> {

    @Column({ type: DataType.INTEGER, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.CHAR, allowNull: false })
    readonly name: string;

    @HasMany(() => ProvidersEntity)
    providers: ProvidersEntity
}