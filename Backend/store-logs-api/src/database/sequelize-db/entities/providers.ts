import { Column, Table, Model, DataType, Sequelize, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { IntegrationsEntity } from './integrations';
import { OrganizationProvidersEntity } from './organization-providers';

@Table({ tableName: 'providers', underscored: true })
export class ProvidersEntity extends Model<IntegrationsEntity>{

    @Column({ type: DataType.INTEGER, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.CHAR, allowNull: false })
    readonly name: string;

    @Column({ type: DataType.CHAR, allowNull: false })
    readonly short_code: string;

    @Column({ type: DataType.INTEGER, allowNull: false })
    @ForeignKey(() => IntegrationsEntity)
    readonly integration_id: number;

    @Column({ type: DataType.TINYINT, defaultValue: 0 })
    readonly status: number;

    // @BelongsTo(() => IntegrationsEntity)
    // integration: IntegrationsEntity

    @HasMany(() => OrganizationProvidersEntity)
    organizationproviders: OrganizationProvidersEntity
} 