
import 'reflect-metadata'; 
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import 'dotenv/config';
import { IBankController } from './bank.controller.interface';


@injectable()
export class BankController extends BaseController implements IBankController {
  constructor(

  ) {
    super();
    this.bindRoute([
     
      
      {
        path: '/products',
        method: 'get',
        func: this.getProducts,
        middleware: []
      },
      {
        path: '/setActive',
        method: 'post',
        func: this.setActive,
        middleware: []
      }
     
    ]);
    }

    async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           const result = [
            {
              name: "Кредит для бизнеса с залогом",
              minSum: 10000,
              maxSum: 100000000,
              minCreditTime: {
                units: "MONTH",
                value: 6
              },
              maxCreditTime: {
                units: "MONTH",
                value: 60
              },
              ooAvailable: true,
              ieAvailable: true,
              minCollateral: 20000
            },
            {
              name: "Кредит для бизнеса без залогов",
              minSum: 10000,
              maxSum: 5000000,
              minCreditTime: {
                units: "MONTH",
                value: 6
              },
              maxCreditTime: {
                units: "MONTH",
                value: 60
              },
              ooAvailable: true,
              ieAvailable: true,
              minCollateral: 0
            },
            {
              name: "Кредит «Деньги на дело»",
              minSum: 0,
              maxSum: 1000000,
              minCreditTime: {
                units: "MONTH",
                value: 6
              },
              maxCreditTime: {
                units: "MONTH",
                value: 60
              },
              ooAvailable: true,
              ieAvailable: false,
              minCollateral: 10000
            },
            {
              name: "Кредит для бизнеса с господдержкой",
              minSum: 0,
              maxSum: 10000000,
              minCreditTime: {
                units: "MONTH",
                value: 6
              },
              maxCreditTime: {
                units: "MONTH",
                value: 60
              },
              ooAvailable: true,
              ieAvailable: false,
              minCollateral: 0
            }
           ]
           if ((global as any).bankisActive) {
              res.json(result)
           } else {
              res.status(503).json({ error: 'Service is currently inactive' });
           }
           
        }  catch (err) {
              next(err);
        } 
    }

    async setActive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           (global as any).bankisActive = req.body.isActive;
           res.json({ message: 'ok' });
        }  catch (err) {
              next(err);
        }
    }
  
}