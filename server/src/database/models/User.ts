import { DataTypes, Model, NOW } from 'sequelize';
import { sequelize } from '../dbconfig';
import { Organization } from './Organization';
import { UserToOrganization } from './UserToOrganization';


export class User extends Model {
  public id!: number;
  public login!: string;
  public fullName!: string;
  public password!: string;

   static associate(models: { Organization: typeof Organization }) {
    this.belongsToMany(Organization, {
      through: UserToOrganization,
      foreignKey: 'userId',
    });
  }

}

User.init(
  {
    id: {
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    login: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
  },


);