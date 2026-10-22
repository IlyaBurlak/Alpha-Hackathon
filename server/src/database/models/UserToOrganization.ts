import { DataTypes, Model, NOW } from 'sequelize';
import { sequelize } from '../dbconfig';
import { User } from './User';
import { Organization } from './Organization';


export class UserToOrganization extends Model {
  public id!: number;
  public userId!: number;
  public organizationId!: number;


   static associate(models: {
       Organization: typeof Organization; 
       User: typeof User 
    }) {
        // this.belongsTo(models.User, {
        //     foreignKey: 'userId',     
        //     targetKey: 'id',      
        //     as: 'user',
        // });
        // this.belongsTo(models.Organization, {
        //     foreignKey: 'organizationId',     
        //     targetKey: 'id',      
        //     as: 'organization',
        // });
    }

}

UserToOrganization.init(
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

  },
  {
    sequelize,
    modelName: 'UserToOrganization',
    tableName: 'user_to_organizations',
    timestamps: false,
  },


);