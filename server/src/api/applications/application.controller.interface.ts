
import { Request, Response, NextFunction } from 'express';

export interface IApplicationController {
  createApplication(req: Request, res: Response, next: NextFunction): Promise<void>
   
}