import { DataTypes, Model, NOW } from 'sequelize';
import { sequelize } from '../dbconfig';
import { Organization } from './Organization';
import { UserToOrganization } from './UserToOrganization';


export class Application extends Model {
    public id!: number;
    public userId!: number;
    public organizationId!: number;
    public sum!: number;
    public creditTimeUnits!: number;
    public creditValue!: number;
    public status!: number;
    public createdAt!: Date;
    public loanIssuanceDate!: Date;


    static associate(models: { Organization: typeof Organization }) {
        this.belongsTo(Organization, {
        foreignKey: 'organizationId',
        as: 'organization',
        });
    }

}

Application.init(
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    organizationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sum: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    creditTimeUnits: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    creditValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.SMALLINT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: NOW,
    },
    loanIssuanceDate: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: NOW,
    },
  },
  {
    sequelize,
    modelName: 'Application',
    tableName: 'applications',
    timestamps: false,
  }
);