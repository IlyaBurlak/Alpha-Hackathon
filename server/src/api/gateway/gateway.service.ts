
import 'reflect-metadata'; 
import { IGatewayService } from "./gateway.service.interface";
import axios from 'axios';
import 'dotenv/config';
import axiosRetry from 'axios-retry';
import { OrganizationType } from '../organizations/entity/organization.entity';
import { ApplicationEntity } from '../applications/entity/application.entity';

export class GatewayService implements IGatewayService{

    async getBanksProducts(): Promise<any> {
        try {
            
            console.log('Запрос на получение доступных продуктов на ' + `${process.env.BANK_API}/products`);
            
            axiosRetry(axios, {
                retries: 3,                          
                retryDelay: (retryCount) => retryCount * 1000, 
                retryCondition: (error) => {
                    return axiosRetry.isNetworkOrIdempotentRequestError(error) 
                        || error.code === 'ECONNABORTED'
                        || (error.response?.status ?? 0) >= 500;
                },
            });

            const response = await axios.get(
                `${process.env.BANK_API}/products`,
                { timeout: Number(process.env.BANK_API_TIMEOUT_MS) || 5000 },
            );
        
            console.log('Статус ответа на запрос доступных продуктов банка ' + response.status);
            
            if (response.status !== 200) {
                return [];
            }
            return response.data && Array.isArray(response.data) ? response.data : [];
          
        } catch (error) {
            return undefined;
        }
    }

    async getCreditBureauHistory(inn: string): Promise<any> {
        try {
            console.log('Запрос на получение кредитной истории на ' + `${process.env.CREDIT_BUREAU_API}/history?inn=${inn}`);

            axiosRetry(axios, {
                retries: 3,                          
                retryDelay: (retryCount) => retryCount * 1000, 
                retryCondition: (error) => {
                    return axiosRetry.isNetworkOrIdempotentRequestError(error) 
                        || error.code === 'ECONNABORTED'
                        || (error.response?.status ?? 0) >= 500;
                },
            });

            const response = await axios.get(
                `${process.env.CREDIT_BUREAU_API}/history?inn=${inn}`,
                { timeout: Number(process.env.CREDIT_BUREAU_API_TIMEOUT_MS) || 5000 },
            );
            console.log('Статус ответа на запрос кредитной истории ' + response.status);
            return response.data ? response.data : null;
        } catch (error) {
            return undefined;
        }
    }

    async getRegisterInfo(inn: string, type: OrganizationType): Promise<any> {
        try {
            console.log('Запрос на получение информации из единого реестра на ' + `${process.env.REGISTER_API}?inn=${inn}`); 

            axiosRetry(axios, {
                retries: 3,                          
                retryDelay: (retryCount) => retryCount * 1000, 
                retryCondition: (error) => {
                    return axiosRetry.isNetworkOrIdempotentRequestError(error) 
                        || error.code === 'ECONNABORTED'
                        || (error.response?.status ?? 0) >= 500;
                },
            }); 
            let endpoint = '';
            if (type === OrganizationType.IndividualEntrepreneur) {
                endpoint = '/individual';
            } else if (type === OrganizationType.OO) {
                endpoint = '/legal';
            }

            const response = await axios.get(
                `${process.env.REGISTER_API}${endpoint}?inn=${inn}`,
                { timeout: Number(process.env.REGISTER_API_TIMEOUT_MS) || 5000 },
            );
            console.log('Статус ответа на запрос информации из единого реестра ' + response.status);
            return response.data ? response.data : null;

        } catch (error) {
            return undefined;
        }
    }

    async getMlScoring (applicationData: ApplicationEntity): Promise<any> {
        try {
            console.log('Запрос на внутренний скоринг на ' + `${process.env.ML_SCORING_API}score`);
           
            axiosRetry(axios, {
                retries: 3,                          
                retryDelay: (retryCount) => retryCount * 1000, 
                retryCondition: (error) => {
                    return axiosRetry.isNetworkOrIdempotentRequestError(error) 
                        || error.code === 'ECONNABORTED'
                        || (error.response?.status ?? 0) >= 500;
                },
            });

            const response = await axios.post(
                `${process.env.ML_SCORING_API}score`,
                {...applicationData},
                { timeout: Number(process.env.ML_SCORING_API_TIMEOUT_MS) || 10000 },
            );
            console.log('Статус ответа на запрос внутреннего скоринга ' + response.status);
            console.log(response.data);
            return response.data ? response.data : null;
        } catch (error) {
            return undefined;
        }
    }

}