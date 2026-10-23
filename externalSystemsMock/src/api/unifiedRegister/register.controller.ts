
import 'reflect-metadata'; 
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { BaseController } from '../common/base.controller';
import 'dotenv/config';
import { IRegisterController } from './register.controller.interface';




@injectable()
export class RegisterController extends BaseController implements IRegisterController {
  constructor(

  ) {
    super();
    this.bindRoute([
     
      
      {
        path: '/legal',
        method: 'get',
        func: this.legal,
        middleware: []
      },
      {
        path: '/invidual',
        method: 'get',
        func: this.invidual,
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

    async legal(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           const data =  [
            {
              inn: "7701234568", 
              fullName: "ООО \"Ромашка\"",
              isActive: true,
              registrationDate: "2020-01-15",
              liquidationDate: null,
              authCapital: 10000,
              employeesCount: 10,
              annualIncome: 500000,
              annualExpenses: 200000
            },
            {
              inn: "5001234569", 
              fullName: "ООО \"Кот не знает\"",
              isActive: true,
              registrationDate: "2021-01-15",
              liquidationDate: null,
              authCapital: 20000,
              employeesCount: 24,
              annualIncome: 400000,
              annualExpenses: 200000
            },
            {
              inn: "7801234562", 
              isActive: false,
              registrationDate: "2020-01-15",
              liquidationDate: "2025-01-15",
              authCapital: 10000,
              employeesCount: 0,
              annualIncome: 0,
              annualExpenses: 0
            },
            {
              inn: "6601234564", 
              fullName: "ООО \"АмёбаПродакшн\"",
              isActive: true,
              registrationDate: "2026-01-15",
              liquidationDate: null,
              authCapital: 20000,
              employeesCount: 459,
              annualIncome: 1000000,
              annualExpenses: 500000
            },
           
           ]

           const inn = req.query.inn as string;
           const result = data.find(item => item.inn === inn);
           res.json(result || { error: 'No credit history found for the provided INN' });
 
        }  catch (err) {
              next(err);
        } 
    }


     async invidual(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
          const data =  [
            {
              inn: "2301234560", 
              fullName: "ИП Сырный Иван",
              isActive: true,
              registrationDate: "2023-01-15",
              liquidationDate: null,
              employeesCount: 1,
              annualIncome: 100000,
              annualExpenses: 50000

             
            },
            {
              inn: "5401234563", 
              fullName: "ИП Динозавриков Сергей", 
              isActive: true,
              registrationDate: "2025-01-15",
              liquidationDate: null,
              employeesCount: 3,
              annualIncome: 300000,
              annualExpenses: 100000
            }
           ]

           const inn = req.query.inn as string;
           const result = data.find(item => item.inn === inn);
           res.json(result || { error: 'No credit history found for the provided INN' });
 
        }  catch (err) {
            next(err);
        } 
    }

    async setActive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           (global as any).registerisActive = req.body.isActive;
           res.json({ message: 'ok' });
        }  catch (err) {
            next(err);
        }
    }
  
}