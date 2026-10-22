import { inject, injectable } from 'inversify';
import { IUserService } from './user.service.interface';
import { TYPES } from '../../types';
import { IUserRepository } from './user.repository.interface';
import { UserEntity } from './entity/user.entity';
import bcrypt from 'bcryptjs';



@injectable()
export class UserService implements IUserService {
    constructor(
        @inject(TYPES.userRepository) private userRepository: IUserRepository
    ) {
       
    }


    async getHello(): Promise<string>{
       return "Hello"
    }

    async getUserByLogin(login: string): Promise<UserEntity> {
        return await this.userRepository.getUserByLogin(login);
    }

    async login(login: string, password: string): Promise<UserEntity> {
        const user = await this.userRepository.getUserByLogin(login);
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            throw new Error(`Неверный логин или пароль`);
        }
        return user;
    }

    

}