
import 'reflect-metadata'; 
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { BaseController } from '../common/base.controller';
import passport from '../../auth/passport.config';

import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { plainToInstance } from 'class-transformer';
import { IApplicationController } from './application.controller.interface';
import { IApplicationService } from './application.service.interface';
import { ApplicationEntity, ApplicationStatus, CreditTimeUnits } from './entity/application.entity';
import { ApplicationDto } from './dto/application.dto';
import { OperatorSolution } from './entity/operator.solution';

@injectable()
export class ApplicationController extends BaseController implements IApplicationController {
  constructor(
    @inject(TYPES.applicationService) private applicationService: IApplicationService ,
  ) {
    super();
    this.bindRoute([
     
      {
        path: '/',
        method: 'post',
        func: this.createApplication,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/',
        method: 'put',
        func: this.confirmApplication,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
     
      {
        path: '/my',
        method: 'get',
        func: this.getMyApplications,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/all',
        method: 'get',
        func: this.getAllApplicationsForOperator,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id',
        method: 'get',
        func: this.getApplicationById,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id/sign',
        method: 'put',
        func: this.sign,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id/score',
        method: 'get',
        func: this.getApplicationWithScore,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
     {
        path: '/:id/special',
        method: 'put',
        func: this.confirmSpecialProduct,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id/restart',
        method: 'post',
        func: this.restartScoring,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id/solution',
        method: 'post',
        func: this.saveOperatorSolution,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id/take',
        method: 'post',
        func: this.takeApplicationForOperator,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
     
    ]);
  }


  /**
   * @swagger
   * /api/applications/:
   *   post:
   *     tags: [Applications]
   *     summary: Создать заявку
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ApplicationCreate'
   *     responses:
   *       200:
   *         description: Заявка создана
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Application'
   */
    async createApplication(req: Request, res: Response, next: NextFunction): Promise<void> { 
        try {
            const applicationData = req.body;
            applicationData.userId = (req.user as { id?: string | number } | undefined)?.id;
            applicationData.creditTime.units = CreditTimeUnits[applicationData.creditTime.units as keyof typeof CreditTimeUnits];
            const result = await this.applicationService.createApplication(applicationData);
            res.json(plainToInstance(ApplicationDto, result))
        }
                 
        catch (err) {
            next(err);
        }
    }

    /**
     * @swagger
     * /api/applications/{id}:
     *   get:
     *     tags: [Applications]
     *     summary: Получить заявку по идентификатору
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         example: 1
     *     responses:
     *       200:
     *         description: Заявка владельца
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Application'

     */
    async getApplicationById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const applicationId = Number(req.params.id);
            const userId = (req.user as { id?:  number } | undefined)?.id;
            if (!userId) {
                res.status(400).json({ error: 'User ID is missing' });
                return;
            }
            const result = await this.applicationService.getApplicationById(applicationId, userId);

            res.json(plainToInstance(ApplicationDto, result))
        }  catch (err) {
            next(err);
        } 
    }

    /**
     * @swagger
     * /api/applications/my:
     *   get:
     *     tags: [Applications]
     *     summary: Получить мои заявки
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Список заявок текущего пользователя
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/Application'
  
     */
    async getMyApplications(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = (req.user as { id?: number } | undefined)?.id;
            if (!userId) {
                res.status(400).json({ error: 'User ID is missing' });
                return;
            }
            const result = await this.applicationService.getApplicationByUserId(userId);
            res.json(plainToInstance(ApplicationDto, result))
        }  catch (err) {
              next(err);
        } 
    }


/**
 * @swagger
 * /api/applications/:
 *   put:
 *     tags: [Applications]
 *     summary: Подтвердить заявку
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Заявка подтверждена
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Application'
 *       400:
 *         description: Недостаточно данных
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
    async confirmApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

            const applicationId = Number(req.query.applicationId); 
            const productId = Number(req.query.productId);
            if (!applicationId || !productId) {
                res.status(400).json({ error: 'Не указаны ID заявки и/или продукта' });
                return;
            }
            const userId = (req.user as { id?: number } | undefined)?.id;
            if (!userId) {
                res.status(400).json({ error: 'Не указан User ID' });
                return;
            }
            const result = await this.applicationService.confirmApplication(applicationId, userId, productId);
            res.json(plainToInstance(ApplicationDto, result))
        }  catch (err) {
            next(err);
        }
      }

      /**
       * @swagger
       * /api/applications/{id}/restart:
       *   post:
       *     tags: [Applications]
       *     summary: Перезапустить скоринг заявки
       *     security:
       *       - bearerAuth: []
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema: { type: integer }
       *     responses:
       *       200:
       *         description: Скоринг запущен
       *       403:
       *         description: Доступ только для оператора
       */
      async restartScoring(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;
            if (!adminAccess) {
                res.status(403).json({ error: 'Доступ запрещен' });
                return;
            }
            const applicationId = Number(req.params.id);
            if (!applicationId) {
                res.status(400).json({ error: 'Не указан ID заявки' });
                return;
            }
            this.applicationService.restartScoring(applicationId);
            res.json(true)
        }  catch (err) {
            next(err);
        }
        
      }

      /**
       * @swagger
       * /api/applications/{id}/score:
       *   get:
       *     tags: [Applications]
       *     summary: Получить заявку с результатом скоринга
       *     security:
       *       - bearerAuth: []
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema: { type: integer }
       *     responses:
       *       200:
       *         description: Заявка и результат скоринга
       *         content:
       *           application/json:
       *             schema:
       *               $ref: '#/components/schemas/Application'
       *       403:
       *         description: Доступ только для оператора
       */
      async getApplicationWithScore(req: Request, res: Response, next: NextFunction): Promise<void> {
          try {
              const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;
              if (!adminAccess) {
                  res.status(403).json({ error: 'Доступ запрещен' });
                  return;
              }
              const applicationId = Number(req.params.id);
              if (!applicationId) {
                  res.status(400).json({ error: 'Не указан ID заявки' });
                  return;
              }
              const result = await this.applicationService.getApplicationWithScore(applicationId);
              res.json(plainToInstance(ApplicationDto, result))
          }  catch (err) {
              next(err);
          }
      }

      /**
       * @swagger
       * /api/applications/{id}/solution:
       *   post:
       *     tags: [Applications]
       *     summary: Сохранить решение оператора
       *     security:
       *       - bearerAuth: []
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema: { type: integer }
       *     requestBody:
       *       required: true
       *       content:
       *         application/json:
       *           schema:
       *             $ref: '#/components/schemas/OperatorSolution'
       *     responses:
       *       200:
       *         description: Решение сохранено
       *       403:
       *         description: Доступ только для оператора
       */
      async saveOperatorSolution(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
              const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;
              if (!adminAccess) {
                  res.status(403).json({ error: 'Доступ запрещен' });
                  return;
              }
              const applicationId = Number(req.params.id);
              if (!applicationId) {
                  res.status(400).json({ error: 'Не указан ID заявки' });
                  return;
              }
              const userId = (req.user as { id?:  number } | undefined)?.id;
              if (!userId) {
                  res.status(400).json({ error: 'Не получилось получить id  пользователя' });
                  return;
              }
              const solution = req.body
              solution.status = ApplicationStatus[solution.status as keyof typeof ApplicationStatus];
              await this.applicationService.saveOperatorSolution(applicationId, solution, userId);
              res.json(true)
          }  catch (err) {
              next(err);
          }
      }


      /**
       * @swagger
       * /api/applications/all:
       *   get:
       *     tags: [Applications]
       *     summary: Получить все заявки для оператора
       *     security:
       *       - bearerAuth: []
       *     responses:
       *       200:
       *         description: Список заявок
       *         content:
       *           application/json:
       *             schema:
       *               type: array
       *               items:
       *                 $ref: '#/components/schemas/Application'
       *       403:
       *         description: Доступ только для оператора
       */
      async getAllApplicationsForOperator(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
              const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;  
              if (!adminAccess) {
                  res.status(403).json({ error: 'Доступ запрещен' });
                  return;
              }
              const result = await this.applicationService.getAllApplicationsForOperator();
              res.json(plainToInstance(ApplicationDto, result))
          }  catch (err) {
              next(err);
          }
      }

      
      /**
       * @swagger
       * /api/applications/{id}/take:
       *   post:
       *     tags: [Applications]
       *     summary: Взять заявку в работу
       *     security:
       *       - bearerAuth: []
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema: { type: integer }
       *     responses:
       *       200:
       *         description: Заявка назначена оператору
       *       403:
       *         description: Доступ только для оператора
       */
      async takeApplicationForOperator(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
              const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;  
              if (!adminAccess) {
                  res.status(403).json({ error: 'Доступ запрещен' });
                  return;
              }
               const userId = (req.user as { id?:  number } | undefined)?.id;
              if (!userId) {
                  res.status(400).json({ error: 'Не получилось получить id  пользователя' });
                  return;
              }
              const applicationId = Number(req.params.id); 
              if (!applicationId) {
                  res.status(400).json({ error: 'Не указан ID заявки' });
                  return;
              }
              await this.applicationService.takeApplicationForOperator(applicationId, userId);
              res.json(true)
          }  catch (err) {
              next(err);
          }
      }


      /**
       * @swagger
       * /api/applications/{id}/special:
       *   put:
       *     tags: [Applications]
       *     summary: Принять или отклонить специальное предложение
       *     security:
       *       - bearerAuth: []
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema: { type: integer }
       *       - in: query
       *         name: status
       *         required: true
       *         schema:
       *           type: string
       *           enum: [SPECIALPRODUCTACCEPTED, SPECIALPRODUCTREJECTED]
       *     responses:
       *       200:
       *         description: Решение по специальному предложению сохранено
       */
      async confirmSpecialProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const applicationId = Number(req.params.id); 
            const status = ApplicationStatus[req.query.status as keyof typeof ApplicationStatus];
            if (!applicationId || !status) {
                res.status(400).json({ error: 'Не указаны ID заявки и/или статуса' });
                return;
            }
            const userId = (req.user as { id?: number } | undefined)?.id;
            if (!userId) {
                res.status(400).json({ error: 'Не указан User ID' });
                return;
            }
            const result = await this.applicationService.acceptSpecialProduct(applicationId, status, userId);
            res.json(true)
        }  catch (err) {
            next(err);
        }
      }

      /**
       * @swagger
       * /api/applications/{id}/sign:
       *   put:
       *     tags: [Applications]
       *     summary: Подписать заявку
       *     security:
       *       - bearerAuth: []
       *     parameters:
       *       - in: path
       *         name: id
       *         required: true
       *         schema: { type: integer }
       *     responses:
       *       200:
       *         description: Заявка подписана
       */
      async sign(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const applicationId = Number(req.params.id); 
            const userId = (req.user as { id?: number } | undefined)?.id;
            if (!userId) {
                res.status(400).json({ error: 'Не указан User ID' });
                return;
            }
            await this.applicationService.signApplication(applicationId, userId);
            res.json(true)
        }  catch (err) {
            next(err);
        }
      }
      
  
}