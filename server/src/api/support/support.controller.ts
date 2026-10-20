import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { ISupportService } from './support.service.interface';
import { TYPES } from '../../types';
import { BaseController } from '../common/base.controller';
import { ISupportController } from './support.controller.interface';



@injectable()
export class SupportController extends BaseController implements ISupportController {
  constructor(
    @inject(TYPES.supportService) private supportService: ISupportService ,
  ) {
    super();
    this.bindRoute([
      {
        path: '/hello',
        method: 'get',
        func: this.getHello,
      },
     
    ]);
  }


  /**
   * @swagger
   * /hello:
   *   get:
   *     summary: Приветствие
   *     description: Возвращает приветственное сообщение
   *     responses:
   *       200:
   *         description: Успешный ответ
   *         content:
   *           text/plain:
   *             schema:
   *               type: string
   *               example: "hello!"
   */

  async getHello(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = "hello!";
      res.send(message);
    } catch (err) {
      next(err);
    }
  }

  
}