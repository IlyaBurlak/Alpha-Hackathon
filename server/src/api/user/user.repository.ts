import { injectable } from 'inversify';
import { IUserRepository } from './user.repository.interface';
import { User } from '../../database/models/User';
import { Organization } from '../../database/models/Organization';
import { UserEntity } from './entity/user.entity';
import { Transaction } from 'sequelize';
import { Operator } from '../../database/models/Operator';



@injectable()
export class UserRepository implements IUserRepository {

    async getCounter(): Promise<number> {
      return 1;
    }

    async getUserByLogin(login: string): Promise<UserEntity> {
        const model = await User.findOne({
            where: { login },
            include: [ 
                { model: Organization }
            ]})
        if (!model) {
            throw new Error(`Неверный логин или пароль`);
        }
        return new UserEntity(model);
    }

    async getUserById(id: number, transaction?: Transaction): Promise<UserEntity> {
        const model = await User.findOne({
            where: { id },
            transaction,
            include: [ 
                { model: Organization }
            ]})
        if (!model) {
            throw new Error(`Пользователь не найден`);
        }
        return new UserEntity(model);
    }

    async getOperatorByLogin(login: string): Promise<UserEntity> {
        const model = await Operator.findOne({
            where: { login },
           })
        if (!model) {
            throw new Error(`Неверный логин или пароль`);
        }
        return new UserEntity(model);
    }
}