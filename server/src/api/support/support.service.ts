import { inject, injectable } from 'inversify';

import { ISupportService } from './support.service.interface';


@injectable()
export class SupportService implements ISupportService {
    constructor(
       
    ) {}


    async getHello(): Promise<string>{
       return "Hello"
    }

    
  

}