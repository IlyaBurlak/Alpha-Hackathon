import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../dbconfig';
import { UserToOrganization } from './UserToOrganization';
import { User } from './User';

export class Organization extends Model {
  public id!: number;
  public fullName!: string;
  public inn!: string;
  public type!: number;
   static associate(models: { User: typeof User }) {
        this.belongsToMany(User, {
          through: UserToOrganization,
        foreignKey: 'organizationId',
        });
    }
}


Organization.init(
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    inn: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.SMALLINT,
      allowNull: false,

    }
  },
  {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
    timestamps: false,
  },
);