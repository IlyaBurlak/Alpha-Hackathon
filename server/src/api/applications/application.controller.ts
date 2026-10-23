
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
import { ApplicationEntity, CreditTimeUnits } from './entity/application.entity';
import { ApplicationDto } from './dto/application.dto';

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
        path: '/:id',
        method: 'get',
        func: this.getApplicationById,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
      {
        path: '/:id/score',
        method: 'get',
        func: this.getApplicationWithScore,
        middleware: [passport.authenticate('jwt', { session: false })]
      },
       {
        path: '/:id/restart',
        method: 'post',
        func: this.restartScoring,
        middleware: [passport.authenticate('jwt', { session: false })]
      }
    
     
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
                res.status(400).json({ error: 'Application ID or Product ID is missing' });
                return;
            }
            const userId = (req.user as { id?: number } | undefined)?.id;
            if (!userId) {
                res.status(400).json({ error: 'User ID is missing' });
                return;
            }
            const result = await this.applicationService.confirmApplication(applicationId, userId, productId);
            res.json(plainToInstance(ApplicationDto, result))
        }  catch (err) {
            next(err);
        }
      }

      async restartScoring(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;
            if (!adminAccess) {
                res.status(403).json({ error: 'Access denied' });
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

      async getApplicationWithScore(req: Request, res: Response, next: NextFunction): Promise<void> {
          try {
              const adminAccess = (req.user as { isAdmin?: boolean } | undefined)?.isAdmin;
              if (!adminAccess) {
                  res.status(403).json({ error: 'Access denied' });
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

      

      
  
}