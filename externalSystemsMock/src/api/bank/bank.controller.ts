
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

    /**
     * @swagger
     * /api/banks/products:
     *   get:
     *     tags: [Bank]
     *     summary: Получить банковские продукты
     *     responses:
     *       200:
     *         description: Список кредитных продуктов
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Product'
     *       503:
     *         description: Банковский сервис отключен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Error'
     */
    async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           const result = [
            {
              id: 1,
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
              minCollateral: 20000,
              persentage: 10,
              payments: "ежемесячно, равными долями, с первым платежом через 6 месяцев"
            },
            {
              id: 2,
              name: "Кредит для бизнеса без залогов",
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
              minCollateral: 0,
              persentage: 15,
               payments: "ежемесячно, равными долями, с первым платежом через 6 месяцев"
            },
            {
              id: 3,
              name: "Кредит «Деньги на дело»",
              minSum: 0,
              maxSum: 1000000,
              minCreditTime: {
                units: "MONTH",
                value: 3
              },
              maxCreditTime: {
                units: "MONTH",
                value: 60
              },
              ooAvailable: false,
              ieAvailable: true,
              minCollateral: 10000,
              persentage: 9,
              payments: "ежемесячно, равными долями, с первым платежом через 3 месяца"
            },
            {
              id: 4,
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
              minCollateral: 0,
              persentage: 5,
              payments: "ежемесячно, равными долями, с первым платежом через 6 месяцев"
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

    /**
     * @swagger
     * /api/banks/setActive:
     *   post:
     *     tags: [Bank]
     *     summary: Включить или отключить банковский сервис
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/ActiveState'
     *     responses:
     *       200:
     *         description: Состояние обновлено
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Message'
     */
    async setActive(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
           (global as any).bankisActive = req.body.isActive;
           res.json({ message: 'ok' });
        }  catch (err) {
              next(err);
        }
    }
  
}