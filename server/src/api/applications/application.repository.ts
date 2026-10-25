import { injectable } from 'inversify';
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity, ApplicationStatus,  } from './entity/application.entity';
import { Application } from '../../database/models/Application';
import { Transaction } from 'sequelize';
import { AnalysisStatus, MlScoreEntity } from './entity/application.score.entity';
import { ApplicationScore } from '../../database/models/ApplicationScoring';
import { sequelize } from '../../database/dbconfig';
import { OperatorSolution } from './entity/operator.solution';
import { Operator } from '../../database/models/Operator';
import { Organization } from '../../database/models/Organization';
import { UserEntity } from '../user/entity/user.entity';




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

    async updateApplicationStatus(applicationId: number, status: ApplicationStatus): Promise<void> {
        await Application.update(
            { status },
            { where: { id: applicationId } }
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
                { info: { ...prev.info, mlScore: info }, score: info.pd, scoringDate: new Date() },
                { where: { applicationId: applicationId  }, transaction }
            );
        });
    }

    async getApplicationWithScore (id: number, transaction?: Transaction): Promise<ApplicationEntity> {
       const model = await Application.findOne({
            where: { id },
            include: [
                { model: ApplicationScore, as: 'applicationScore' },
                { model: Operator, as: 'operator' },
                { model: Organization, as: 'organization' },
            ],
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
    
    async saveOperatorSolution(applicationId: number, solution: OperatorSolution, operatorId: number): Promise<void> {
        return sequelize.transaction(async (transaction) => {
            const prev = await ApplicationScore.findOne({ where: { applicationId: applicationId }, transaction });
            const application = await Application.findOne({ where: { id: applicationId }, transaction });
            if (application?.operatorId !== operatorId) {
                throw new Error(`Эта заявка не назначена для данного оператора.`);
            }
            if (!prev) {
                throw new Error(`Заявка с id ${applicationId} не найдена`);
            } 
            if (prev.status !== AnalysisStatus.WAITONGOPERATOR){
                throw new Error(`По этой заявке не нужно решение оператора.`);
            }
            await ApplicationScore.update(
                { status: AnalysisStatus.COMPLETED, },
                { where: { applicationId: applicationId  }, transaction }  
            );
            let productCond = {};
            if (solution.status === ApplicationStatus.SPECIALPRODUCTOFFERED && solution.product) {
                productCond = {productConditions: {
                   ...solution.product
                }}
            }
            await Application.update(
                { solutionComment: solution.comment, status: solution.status, ...productCond },
                { where: { id: applicationId  }, transaction }  
            );
        });
    }

    async getAllApplicationsForOperator(): Promise<ApplicationEntity[]> {
        const models = await Application.findAll({
            where: {  },
            include: [
                { model: ApplicationScore, as: 'applicationScore' },
                { model: Operator, as: 'operator' },
                { model: Organization, as: 'organization' },
            ],

        });
        
        return models ? models.map((model: any) => { 
            const result = new ApplicationEntity(model);
          
       
            if (result.applicationScore) {
                delete result.applicationScore.history;
                delete result.applicationScore.registerInfo;
            }
            
            return result;
        }) : [];
    }

    async takeApplicationForOperator(applicationId: number, operatorId: number): Promise<void> {
      
        await Application.update(
            { operatorId },
            { where: { id: applicationId } }
        );
     
    }
    
}