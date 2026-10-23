import { injectable } from 'inversify';
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity, ApplicationStatus,  } from './entity/application.entity';
import { Application } from '../../database/models/Application';
import { Transaction } from 'sequelize';



@injectable()
export class ApplicationRepository implements IApplicationRepository {


    async createApplication(application: ApplicationEntity, transaction?: Transaction): Promise<ApplicationEntity> {
      
        const model = await Application.create({
            userId: application.userId,
            organizationId: application.organizationId,
            sum: application.sum,
            creditTimeUnits: application.creditTime.units,
            creditValue: application.creditTime.value,
            status: ApplicationStatus.DRAFT
        }, { transaction })

        return new ApplicationEntity(model);

    }

    async confirmApplication(applicationId: number, product: any, transaction?: Transaction): Promise<ApplicationEntity> {
        await Application.update(
            { productId: product.id, productConditions: {name: product.name, persentage: product.persentage, payments: product.payments }, status: ApplicationStatus.SUBMITTED },
            { where: { id: applicationId }, transaction }
        );
        return await this.getApplicationById(applicationId, transaction);
    }

    async getApplicationById(id: number, transaction?: Transaction): Promise<ApplicationEntity> {
        const model = await Application.findOne({
            where: { id },
            transaction,
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