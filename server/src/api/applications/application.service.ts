import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import bcrypt from 'bcryptjs';
import { IApplicationService } from './application.service.interface';
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity, ApplicationStatus, CreditTime, CreditTimeUnits } from './entity/application.entity';
import { OrganizationEntity, OrganizationType } from '../organizations/entity/organization.entity';
import { IUserRepository } from '../user/user.repository.interface';
import { IGatewayService } from '../gateway/gateway.service.interface';
import { sequelize } from '../../database/dbconfig';
import { AnalysisStatus } from './entity/application.score.entity';
import { OperatorSolution } from './entity/operator.solution';



@injectable()
export class ApplicationService implements IApplicationService {
    constructor(
        @inject(TYPES.applicationRepository) private applicationRepository: IApplicationRepository,
        @inject(TYPES.userRepository) private userRepository: IUserRepository,
        @inject(TYPES.gatewayService) private gatewayService: IGatewayService
    ) {
       
    }

    private convertCreditTimeToDays(time: CreditTime): number {
        switch (time.units) {
            case CreditTimeUnits.DAY:
                return time.value;
            case CreditTimeUnits.MONTH:
                return time.value * 30; 
            case CreditTimeUnits.YEAR:
                return time.value * 365; 
            default:
                return 0;
        }
    }

    private async filterAvailableProducts(application: ApplicationEntity, org: OrganizationEntity): Promise<any> {
        let allProducts = await this.gatewayService.getBanksProducts();
        let availableProducts = undefined;

        if (allProducts) allProducts = allProducts.map((product: any) => { 
            product.minCreditTime.units = CreditTimeUnits[product.minCreditTime.units as keyof typeof CreditTimeUnits];
            product.maxCreditTime.units = CreditTimeUnits[product.maxCreditTime.units as keyof typeof CreditTimeUnits];
            return product
        }); 


        if (allProducts && Array.isArray(allProducts) && allProducts.length > 0) {
            availableProducts = (application as any).products = allProducts.filter((product: any) => (
                (product.ooAvailable && org.type == OrganizationType.OO) || (product.ieAvailable && org.type == OrganizationType.IndividualEntrepreneur)) 
                && application.sum >= product.minSum && application.sum <= product.maxSum 
                && this.convertCreditTimeToDays(application.creditTime) >= this.convertCreditTimeToDays(product.minCreditTime) 
                && this.convertCreditTimeToDays(application.creditTime) <= this.convertCreditTimeToDays(product.maxCreditTime) 
             );
        }
        return availableProducts;
    }

    private async handleProducts(application: ApplicationEntity, products: any[]): Promise<any> {
        return products.map((product: any) => { return {
            id: product.id,
            name: product.name,
            sum: application.sum,
            creditTime: application.creditTime,
            collateral: product.minCollateral > 0 ? (product.minCollateral + (application.sum ) * (product.persentage / 100)) : 0,
            persentage: product.persentage,
            payments: product.payments
        }
            
        })
    }

    private async addAvailableProductsInfo(application: ApplicationEntity, org: OrganizationEntity): Promise<ApplicationEntity> {
        const availableProducts = await this.filterAvailableProducts(application, org);
        if (availableProducts) {
            const handledProducts = await this.handleProducts(application, availableProducts);
            (application as any).products = handledProducts;
        }
       
        return application;
    }

    private async handleApplication(application: ApplicationEntity, org: OrganizationEntity): Promise<void> {
        
        await this.applicationRepository.createApplicationScore(application.id);
        await this.applicationRepository.updateApplicationScoringStatus(application.id, AnalysisStatus.PENDINGCRREDITHISTORY);
        await this.applicationRepository.updateApplicationScoringInfo(application.id, { });
        const history = await this.gatewayService.getCreditBureauHistory(org.inn);
       
        if (history) {
            await this.applicationRepository.updateApplicationScoringInfo(application.id, { history });
        }
       
        
        await this.applicationRepository.updateApplicationScoringStatus(application.id, AnalysisStatus.PENDINGREGISTER);
        const registerInfo = await this.gatewayService.getRegisterInfo(org.inn, org.type);
        if (registerInfo) {
            await this.applicationRepository.updateApplicationScoringInfo(application.id, { registerInfo });
        }

        const t = {
        pd:0.1,
        model_version:"stub-0.0",
        factors:[
            "revenue_cv",
              "profit_cv",
              "assets_cv",
              "liabilities_cv",
              "equity_cv",
        ],}
        await this.applicationRepository.updateApplicationScoringStatus(application.id, AnalysisStatus.WAITNGSCORING);
        const applicationData = JSON.parse(JSON.stringify(await this.applicationRepository.getApplicationWithScore(application.id)));
        

        const scoringResult = await this.gatewayService.getMlScoring(applicationData);
        if (scoringResult) {
            await this.applicationRepository.updateApplicationScore(application.id, t);
        }
        await this.applicationRepository.updateApplicationScoringStatus(application.id, AnalysisStatus.WAITONGOPERATOR);
        
    }
    

    async restartScoring(applicationId: number): Promise<void> {
        const application = await this.applicationRepository.getApplicationWithScore(applicationId);
        if (application.status !== ApplicationStatus.SUBMITTED) {
            throw new Error(`Заявка не находится в статусе SUBMITTED: возможно она еще не была отправлена или уже была обработана`);
        }
        const userInfo = await this.userRepository.getUserById(application.userId);
        const org = userInfo.organizations.find((org: OrganizationEntity) => org.id === application.organizationId);
        this.handleApplication(application, org!);
        
    }

    async getApplicationWithScore(id: number): Promise<ApplicationEntity> {
        return this.applicationRepository.getApplicationWithScore(id);
    }


    async createApplication(application: ApplicationEntity ): Promise<ApplicationEntity> {
        return sequelize.transaction(async (transaction) => {
            const userInfo = await this.userRepository.getUserById(application.userId, transaction);
            const org = userInfo.organizations.find((org: OrganizationEntity) => org.id === application.organizationId);
            if (!org) {
                throw new Error(`Не найдена связь текущего пользователя с организацией из заявки`);
            }

            let result = await this.applicationRepository.createApplication(application, transaction);
            result = await this.addAvailableProductsInfo(result, org);

            return result;
        });
    }


    async confirmApplication(applicationId: number, userId: number, productId: number): Promise<ApplicationEntity> {
        let applicationForHandler: ApplicationEntity;
        let orgForHandler: OrganizationEntity;

        const confirmed = await sequelize.transaction(async (transaction) => {
            const application = await this.applicationRepository.getApplicationById(applicationId, transaction);
            const userInfo = await this.userRepository.getUserById(application.userId, transaction);
            const org = userInfo.organizations.find((org: OrganizationEntity) => org.id === application.organizationId);
            if (application.productId) {
                throw new Error(`Продукт уже выбран для данной заявки`);
            }
            if (application.userId !== userId) {
                throw new Error(`Нет доступа к заявке`);
            }
            if (!org) {
                throw new Error(`Не найдена связь текущего пользователя с организацией из заявки`);
            }
            const availableProducts = await this.filterAvailableProducts(application, org);
            if (availableProducts === undefined) {
                throw new Error(`Сервисы банка недоступны. Попробуйте позже`);
            }
            const handledProducts = await this.handleProducts(application, availableProducts);
            const product = handledProducts.find((product: any) => product.id === productId);
            if (!product) {
                throw new Error(`Выбранный продукт недоступен для данной заявки`);
            }

            applicationForHandler = application;
            orgForHandler = org;

            return this.applicationRepository.confirmApplication(applicationId, product, transaction);
        });

        
        void this.handleApplication(applicationForHandler!, orgForHandler!)

        return confirmed;
    }


    async getApplicationById(id: number, userId: number): Promise<ApplicationEntity> {
        return sequelize.transaction(async (transaction) => {
        let result =  await this.applicationRepository.getApplicationById(id);
        if (result.userId !== userId) {
            throw new Error(`Нет доступа к заявке`);
        }
        if (!result.productId) {
            const userInfo = await this.userRepository.getUserById(result.userId, transaction);
            const org = userInfo.organizations.find((org: OrganizationEntity) => org.id === result.organizationId);
            if (!org) {
                throw new Error(`Не найдена связь текущего пользователя с организацией из заявки`);
            }
            result = await this.addAvailableProductsInfo(result, org);
        }
        
        return result;
        });
        
    }

    async getApplicationByUserId(userId: number): Promise<ApplicationEntity[]> {
        return await this.applicationRepository.getApplicationByUserId(userId);
    }

    async saveOperatorSolution(applicationId: number, solution: OperatorSolution, operatorId: number): Promise<void> {
        if (solution.status == ApplicationStatus.SPECIALPRODUCTOFFERED && !solution.product) {
            throw new Error(`Не указан продукт для специального предложения`);
        }
        if (!(solution.status === ApplicationStatus.SPECIALPRODUCTOFFERED || solution.status === ApplicationStatus.APPROVED || solution.status === ApplicationStatus.REJECTED )) {
            throw new Error(`Неверный статус решения оператора. Доступные статусы: SPECIALPRODUCTOFFERED, APPROVED, REJECTED`);
        }
        return this.applicationRepository.saveOperatorSolution(applicationId, solution, operatorId);
    }

    async getAllApplicationsForOperator(): Promise<ApplicationEntity[]> {
        return this.applicationRepository.getAllApplicationsForOperator();
    }

    async takeApplicationForOperator(applicationId: number, operatorId: number): Promise<void>{
        return this.applicationRepository.takeApplicationForOperator(applicationId, operatorId);
    }

    async updateApplicationStatus(applicationId: number, status: ApplicationStatus): Promise<void> {
        return this.applicationRepository.updateApplicationStatus(applicationId, status);
    }


    async acceptSpecialProduct(applicationId: number, status: ApplicationStatus, userId: number): Promise<void> {
        if (!(status === ApplicationStatus.SPECIALPRODUCTACCEPTED || status === ApplicationStatus.SPECIALPRODUCTREJECTED)) {
            throw new Error(`Неверный статус решения пользователя. Доступные статусы: SPECIALPRODUCTACCEPTED, SPECIALPRODUCTREJECTED`);
        }
        const application = await this.applicationRepository.getApplicationById(applicationId);
        if (application.userId !== userId) {
            throw new Error(`Нет доступа к заявке`);
        }
        if (application.status !== ApplicationStatus.SPECIALPRODUCTOFFERED) {
            throw new Error(`Заявка не находится в статусе SPECIALPRODUCTOFFERED`);
        }
        return this.applicationRepository.updateApplicationStatus(applicationId, status);
    }

    async signApplication(applicationId: number, userId: number): Promise<void> {

        const application = await this.applicationRepository.getApplicationById(applicationId);
        if (application.userId !== userId) {
            throw new Error(`Нет доступа к заявке`);
        }
        if (application.status !== ApplicationStatus.SPECIALPRODUCTACCEPTED && application.status !== ApplicationStatus.APPROVED) {
            throw new Error(`Заявка не находится в статусе SPECIALPRODUCTOFFERED`);
        }
        return this.applicationRepository.updateApplicationStatus(applicationId, ApplicationStatus.SIGNED);
    }

    

}