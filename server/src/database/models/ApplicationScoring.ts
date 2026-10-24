import { DataTypes, Model, NOW } from 'sequelize';
import { sequelize } from '../dbconfig';
import { Organization } from './Organization';


export class ApplicationScore extends Model {
    public id!: number;
    public applicationId!: number;
    public scoringDate!: Date;
    public score!: number;
    public info!: any;
    public status!: number;
    public creatingDate!: Date;

    static associate(models: { Organization: typeof Organization }) {
        this.belongsTo(Organization, {
        foreignKey: 'organizationId',
        as: 'organization',
        });
    }

}

ApplicationScore.init(
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    applicationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    info: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    scoringDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    creatingDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: NOW
    },
    status: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1
    }
  },
  {
    sequelize,
    modelName: 'ApplicationScore',
    tableName: 'applications_scoring',
    timestamps: false,
  }
);