
import 'reflect-metadata'; 
import { IGatewayService } from "./gateway.service.interface";
import axios from 'axios';
import 'dotenv/config';
import axiosRetry from 'axios-retry';

export class GatewayService implements IGatewayService{


    async getBanksProducts(): Promise<any[]> {
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
            
            
            return response.data && Array.isArray(response.data) ? response.data : [];
          
        } catch (error) {
            return [];
        }
    }

}