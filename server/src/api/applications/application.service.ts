import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import bcrypt from 'bcryptjs';
import { IApplicationService } from './application.service.interface';
import { IApplicationRepository } from './application.repository.interface';
import { ApplicationEntity, CreditTime, CreditTimeUnits } from './entity/application.entity';
import { OrganizationEntity, OrganizationType } from '../organizations/entity/organization.entity';
import { IUserRepository } from '../user/user.repository.interface';
import { IGatewayService } from '../gateway/gateway.service.interface';
import { sequelize } from '../../database/dbconfig';



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

        allProducts = allProducts.map((product: any) => { 
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
        return sequelize.transaction(async (transaction) => {
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

            return this.applicationRepository.confirmApplication(applicationId, product, transaction);
        });
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
   

    

}