import { injectable } from 'inversify';
import { User } from '../../database/models/User';
import { Organization } from '../../database/models/Organization'
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity, ApplicationStatus,  } from './entity/application.entity';
import { Application } from '../../database/models/Application';



@injectable()
export class ApplicationRepository implements IApplicationRepository {


    async createApplication(application: ApplicationEntity): Promise<ApplicationEntity> {
      
        const model = await Application.create({
            userId: application.userId,
            organizationId: application.organizationId,
            sum: application.sum,
            creditTimeUnits: application.creditTime.units,
            creditValue: application.creditTime.value,
            status: ApplicationStatus.DRAFT
        })

        return new ApplicationEntity(model);

    }

    async getApplicationById(id: number): Promise<ApplicationEntity> {
        const model = await Application.findOne({
            where: { id },
            })
        if (!model) {
            throw new Error(`Заявка не найдена`);
        }
        return new ApplicationEntity(model);
    }

    async getApplicationByUserId(userId: number): Promise<ApplicationEntity[]> {
        const models = await Application.findAll({
            where: { userId },
            })
            
        return models.map((model) => new ApplicationEntity(model));
    }
    
}