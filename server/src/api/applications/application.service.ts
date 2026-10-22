import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import bcrypt from 'bcryptjs';
import { IApplicationService } from './application.service.interface';
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity } from './entity/application.entity';
import { OrganizationEntity } from '../organizations/entity/organization.entity';
import { IUserRepository } from '../user/user.repository.interface';



@injectable()
export class ApplicationService implements IApplicationService {
    constructor(
        @inject(TYPES.applicationRepository) private applicationRepository: IApplicationRepository,
        @inject(TYPES.userRepository) private userRepository: IUserRepository
    ) {
       
    }



    async createApplication(application: ApplicationEntity ): Promise<ApplicationEntity> {
        const userInfo = await this.userRepository.getUserById(application.userId);
        if (!userInfo.organizations.some((org: OrganizationEntity) => org.id === application.organizationId)) {
            throw new Error(`Не найдена связь текущего пользователя с организацией из заявки`);
        }
        return await this.applicationRepository.createApplication(application)
    }

    async getApplicationById(id: number, userId: number): Promise<ApplicationEntity> {

        const res =  await this.applicationRepository.getApplicationById(id);
        if (res.userId !== userId) {
            throw new Error(`Нет доступа к заявке`);
        }
        return res;
    }

    async getApplicationByUserId(userId: number): Promise<ApplicationEntity[]> {
        return await this.applicationRepository.getApplicationByUserId(userId);
    }
   

    

}