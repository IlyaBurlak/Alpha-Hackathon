
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
      }
     
    ]);
  }


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
  
}