import { DataTypes, Model, NOW } from 'sequelize';
import { sequelize } from '../dbconfig';
import { Organization } from './Organization';
import { UserToOrganization } from './UserToOrganization';
import { ApplicationScore } from './ApplicationScoring';


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
    public productId!: number;
    public productConditions!: any;
    public solutionComment!: string;


    static associate(models: { Organization: typeof Organization }) {
        this.belongsTo(Organization, {
          foreignKey: 'organizationId',
          as: 'organization',
        });
        this.hasOne(ApplicationScore, {
            foreignKey: 'applicationId',
            as: 'applicationScore',
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
    productId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    productConditions: {
      type: DataTypes.JSON,
      allowNull: true,
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
    solutionComment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Application',
    tableName: 'applications',
    timestamps: false,
  }
);