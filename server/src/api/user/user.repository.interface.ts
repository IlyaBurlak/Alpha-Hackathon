import { UserEntity } from "./entity/user.entity";

export interface IUserRepository {
 
  getCounter(): Promise<number>;
  getUserByLogin(login: string): Promise<UserEntity>;
  getUserById(id: number): Promise<UserEntity>
}