import { Column, Table, Model, DataType, Sequelize, BelongsTo, ForeignKey } from 'sequelize-typescript';
import { OrganizationProvidersEntity } from './organization-providers';

@Table({ tableName: 'organization_provider_credentials', underscored: true })
export class OrganizationProvidersCredentialsEntity extends Model<OrganizationProvidersEntity>{

    @Column({ type: DataType.INTEGER, allowNull: false, autoIncrement: true, unique: true, primaryKey: true })
    readonly id: number;

    @Column({ type: DataType.INTEGER, allowNull: false })
    @ForeignKey(() => OrganizationProvidersEntity)
    readonly org_provider_id: number;

    @Column({ type: DataType.TEXT, allowNull: false })
    readonly creds: string;

    @Column({ type: DataType.BIGINT, allowNull: false })
    readonly created_by: number;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly created_at: Date;

    @Column({ type: DataType.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') })
    readonly updated_at: Date;

    @BelongsTo(() => OrganizationProvidersEntity)
    organizationprovider: OrganizationProvidersEntity
}