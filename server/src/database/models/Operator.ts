import { Model, DataTypes, Sequelize } from 'sequelize';
import { sequelize } from '../dbconfig';

export class Operator extends Model {
  public id!: number;
  public login!: string;
  public password!: string;
  public fullName?: string; 
}


Operator.init(
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
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Operator',
    tableName: 'operators',
    timestamps: false,
  },
);