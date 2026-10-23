import { UserEntity } from "./entity/user.entity";
import { Transaction } from "sequelize";

export interface IUserRepository {
 
  getCounter(): Promise<number>;
  getUserByLogin(login: string): Promise<UserEntity>;
  getUserById(id: number, transaction?: Transaction): Promise<UserEntity>
}