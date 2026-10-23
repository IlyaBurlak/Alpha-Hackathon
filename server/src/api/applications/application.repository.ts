import { injectable } from 'inversify';
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity, ApplicationStatus,  } from './entity/application.entity';
import { Application } from '../../database/models/Application';
import { Transaction } from 'sequelize';
import { AnalysisStatus, MlScoreEntity } from './entity/application.score.entity';
import { ApplicationScore } from '../../database/models/ApplicationScoring';
import { sequelize } from '../../database/dbconfig';




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

    async updateApplicationScoringStatus(applicationId: number, status: AnalysisStatus): Promise<void> {
        await ApplicationScore.update(
            { status },
            { where: { applicationId: applicationId } }
        );
    }

    async updateApplicationScoringInfo(applicationId: number, info: any): Promise<void> {

        return sequelize.transaction(async (transaction) => {
            const prev = await ApplicationScore.findOne({ where: { applicationId: applicationId }, transaction });
            if (!prev) {
                throw new Error(`ApplicationScore with id ${applicationId} not found`);
            } 
            if (JSON.stringify(info) === JSON.stringify({})){
                prev.info = {}
            }           
            await ApplicationScore.update(
                { info: { ...prev.info, ...info } },
                { where: { applicationId: applicationId  }, transaction }
            );
        });
    }

    async updateApplicationScore(applicationId: number, info: MlScoreEntity): Promise<void> {

        return sequelize.transaction(async (transaction) => {
            const prev = await ApplicationScore.findOne({ where: { applicationId: applicationId }, transaction });
            if (!prev) {
                throw new Error(`ApplicationScore with id ${applicationId} not found`);
            }            
            await ApplicationScore.update(
                { info: { ...prev.info, mlScore: { factors: info.factors, model_version: info.model_version} }, score: info.pd },
                { where: { applicationId: applicationId  }, transaction }
            );
        });
    }

    async getApplicationWithScore (id: number, transaction?: Transaction): Promise<ApplicationEntity> {
       const model = await Application.findOne({
            where: { id },
            include: [{ model: ApplicationScore, as: 'applicationScore' }],
            transaction,
            })
        if (!model) {
            throw new Error(`Заявка не найдена`);
        }
        return new ApplicationEntity(model);
    }

    async createApplicationScore(applicationId: number): Promise<void> {
         return sequelize.transaction(async (transaction) => {
            const created = await ApplicationScore.findOne({
                where: { applicationId },
                transaction,
            });
            if (created) { return; }
            await ApplicationScore.create({
                applicationId,
                status: AnalysisStatus.PENDINGCRREDITHISTORY,
                info: {}
            }, { transaction });
        });
    }
    
}