import { injectable } from 'inversify';
import { IUserRepository } from './user.repository.interface';
import { User } from '../../database/models/User';
import { Organization } from '../../database/models/Organization';
import { UserEntity } from './entity/user.entity';



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

    async getUserById(id: number): Promise<UserEntity> {
        const model = await User.findOne({
            where: { id },
            include: [ 
                { model: Organization }
            ]})
        if (!model) {
            throw new Error(`Пользователь не найден`);
        }
        return new UserEntity(model);
    }

}