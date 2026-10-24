
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
              type: "ООО",
              inn: "7701234568", 
              ogrn: "1234567890123",
              okved: "46.90 Оптовая торговля неспециализированная",
              fullName: "ООО \"Ромашка\"",
              head: "Подсолнухов Роман Иванович",
              kpp: "770101001",
              address:"г. Москва, ул. Ленина, д. 1",
              account: "4018****23",
              isActive: true,
              registrationDate: "2020-01-15",
              bankClientSince: "2023-01-15",
              liquidationDate: null,
              authCapital: 10000,
              employeesCount: 10,
              annualIncome: 500000,
              annualExpenses: 200000,
              lastYearBalances: [
                100000, 100040, 100023, 140022, 200342, 123333, 4632222, 200001, 322221, 104000, 100500, 100000, 100023, 140022, 200342, 123333,
              ]
            },
            {
              type: "ООО",
              inn: "5001234569", 
              ogrn: "1234567890124",
              okved: "58.19 Виды издательской деятельности прочие",
              head: "Василенко Анжелика",
              fullName: "ООО \"Кот не знает\"",
              address:"г. Санкт-Петербург, ул. Ленина, д. 2",
              kpp: "500101001",
              account: "4015****23",
              isActive: true,
              registrationDate: "2021-01-15",
              bankClientSince: "2023-01-15",
              liquidationDate: null,
              authCapital: 20000,
              employeesCount: 24,
              annualIncome: 400000,
              lastYearBalances: [
                100000, 100040, 100023, 140022, 200342, 123333, 4632222, 200001, 322221, 104000, 100500, 100000, 100023, 140022, 200342, 123333,
              ],
              annualExpenses: 200000
            },
            {
              type: "ООО",
              inn: "7801234562", 
              ogrn: "1234567890125",
              okved: "46.90 Оптовая торговля неспециализированная",
              fullName: "ООО \"Таинственный сад\"",
              head: "Франсина Бернетт",
              address:"г. Новосибирск, ул. Ленина, д. 3",
              kpp: "780101001",
              account: "4018****24",
              isActive: false,
              registrationDate: "2020-01-15",
              liquidationDate: "2025-01-15",
              bankClientSince: "2020-01-15",
              authCapital: 10000,
              employeesCount: 0,
              annualIncome: 0,
              lastYearBalances: [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              ],
              annualExpenses: 0
            },
            {
              type: "ООО",
              inn: "6601234564", 
              ogrn: "1234567890126",
              okved: "62.01 Разработка компьютерного программного обеспечения",
              head: "Иванова Алина Сергеевна",
              fullName: "ООО \"АмёбаПродакшн\"",
              address:"г. Екатеринбург, ул. Ленина, д. 4",
              kpp: "660101001",
              account: "4018****25",
              isActive: true,
              registrationDate: "2026-01-15",
              bankClientSince: "2026-01-15",
              liquidationDate: null,
              authCapital: 20000,
              employeesCount: 459,
              annualIncome: 1000000,
              annualExpenses: 500000,
              lastYearBalances: [
                1347821,582104,2015673,764390,1892045,438917,1205566,2148302,957734,1673208,316455,1984120,629871,2087543,1102369,745218
              ]
            },
           
           ]

          const inn = req.query.inn as string;
          const result = data.find(item => item.inn === inn);
          if ((global as any).registerisActive) {
              res.json(result || { error: 'No credit history found for the provided INN' });
          } else {
             res.status(503).json({ error: 'Service is currently inactive' });
          }
 
        }  catch (err) {
              next(err);
        } 
    }


     async invidual(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
          const data =  [
            {
              type: "ИП",
              inn: "2301234560", 
              ogrn: "1234567890127",
              okved: "46.90 Оптовая торговля неспециализированная",
              fullName: "ИП Сырный Иван",
              account: "4018****22",
              isActive: true,
              registrationDate: "2023-01-15",
              liquidationDate: null,
              employeesCount: 1,
              annualIncome: 100000,
              annualExpenses: 50000,
              lastYearBalances: [
               1054372, 1876540, 432019, 2003745, 689210, 1542883, 947026, 1230471, 2118604, 356789, 1765320, 804195, 1490638, 2067912, 573046, 1321587
              ],
              bankClientSince: "2023-01-15",

             
            },
            {
              type: "ИП",
              inn: "5401234563", 
              ogrn: "1234567890128",
              okved: "32.40 Производство игр и игрушек",
              fullName: "ИП Динозавриков Сергей", 
              isActive: true,
              account: "4018****23",
              registrationDate: "2025-01-15",
              bankClientSince: "2025-01-15",
              liquidationDate: null,
              employeesCount: 3,
              annualIncome: 300000,
              annualExpenses: 100000,
              lastYearBalances: [
               2145098, 634721, 1908436, 287510, 1673249, 1042865, 2019374, 756082, 1384517, 529603, 1950128, 843760, 1206935, 2087451, 468329, 1715804
              ]
            }
           ]



          const inn = req.query.inn as string;
          const result = data.find(item => item.inn === inn);
          if ((global as any).registerisActive) {
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
           (global as any).registerisActive = req.body.isActive;
           res.json({ message: 'ok' });
        }  catch (err) {
            next(err);
        }
    }
  
}