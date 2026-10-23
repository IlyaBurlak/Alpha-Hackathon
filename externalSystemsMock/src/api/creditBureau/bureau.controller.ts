
import 'reflect-metadata'; 
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import 'dotenv/config';
import { ICreditBureauController } from './bureau.controller.interface';



@injectable()
export class CreditBureauController extends BaseController implements ICreditBureauController {
  constructor(

  ) {
    super();
    this.bindRoute([
      {
        path: '/history',
        method: 'get',
        func: this.getCreditHistory,
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

    async getCreditHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           const data =  [
            {
              inn: "7701234568", 
              fullName: "ООО \"Ромашка\"",
              creditHistory: [
                {
                  provisionDate: "2023-01-15",
                  sum: 100000,
                  status: "PAID",
                  paymentDeadline: "2023-12-15"
                },
              ],
              bankrupt: false,
              casesDelayedPayment: 0
            },
            {
              inn: "5001234569", 
              fullName: "ООО \"Кот не знает\"",
              creditHistory: [
                {
                  provisionDate: "2022-05-10",
                  sum: 50000,
                  status: "PAID",
                  paymentDeadline: "2023-05-10"
                },
              ],
              bankrupt: false,
              casesDelayedPayment: 0
            },
            {
              inn: "7801234562", 
              fullName: "ООО \"Таинственный сад\"",
              creditHistory: [
              ],
              bankrupt: true,
              casesDelayedPayment: 0
            },
            {
              inn: "6601234564", 
              fullName: "ООО \"АмёбаПродакшн\"",
              creditHistory: [
                {
                  provisionDate: "2023-03-20",
                  sum: 75000,
                  status: "DELAYED",
                  paymentDeadline: "2023-03-20"
                },
              ],
              bankrupt: false,
              casesDelayedPayment: 1
            },
            {
              inn: "2301234560", 
              fullName: "ИП Сырный Иван",
              creditHistory: [
              ],
              bankrupt: false,
              casesDelayedPayment: 0
            },
            {
              inn: "5401234563", 
              fullName: "ИП Динозавриков Сергей", 
              creditHistory: [
                {
                  provisionDate: "2023-06-01",
                  sum: 100000,
                  status: "PAID", 
                  paymentDeadline: "2024-06-01"},
                  {
                    provisionDate: "2022-06-01",
                    sum: 50000,
                    status: "PAID", 
                    paymentDeadline: "2023-06-01"
                  },
                  {
                    provisionDate: "2021-06-01",
                    sum: 50000,
                    status: "PAID", 
                    paymentDeadline: "2022-06-01"
                  }
              ],
              bankrupt: false,
              casesDelayedPayment: 1
            }
           ]

           const inn = req.query.inn as string;
           const result = data.find(item => item.inn === inn);
          

           if ((global as any).bureauisActive) {
               res.json(result || { error: 'No credit history found for the provided INN' });
           } else {
              res.status(503).json({ error: 'Service is currently inactive' });
           }
 
        }  catch (err) {
              next(err);
        } 
    }

    async setActive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           (global as any).bureauisActive = req.body.isActive;
           res.json({ message: 'ok' });
        }  catch (err) {
              next(err);
        }
    }
  
}