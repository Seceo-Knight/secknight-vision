import { Column, Table, Model, DataType, Sequelize, BelongsTo, ForeignKey, HasMany } from 'sequelize-typescript';
import { ProvidersEntity } from './providers';
import { OrganizationProvidersCredentialsEntity } from './organization-providers-credentials';

@Table({ tableName: 'organization_providers', underscored: true })
export class OrganizationProvidersEntity extends Model<ProvidersEntity>{

    @Column({ type: DataType.INTEGER, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.BIGINT, allowNull: false })
    readonly organization_id: number;

    @Column({ type: DataType.BIGINT, allowNull: false })
    readonly created_by: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    @ForeignKey(() => ProvidersEntity)
    readonly provider_id: number;

    @Column({ type: DataType.TINYINT, defaultValue: 0 })
    readonly status: number;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly created_at: Date;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly updated_at: Date;

    // @BelongsTo(() => ProvidersEntity)
    // providersEntity: ProvidersEntity;

    @HasMany(() => OrganizationProvidersCredentialsEntity)
    orgProCreds: OrganizationProvidersCredentialsEntity;
}