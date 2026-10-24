import { UserEntity } from "./entity/user.entity"


export interface IUserService {
  getHello(): Promise<string>
  getUserByLogin(login: string): Promise<UserEntity>;
  login(login: string, password: string): Promise<UserEntity>;
  loginOperator(login: string, password: string): Promise<UserEntity>;
  getOperatorByLogin(login: string): Promise<UserEntity>
}