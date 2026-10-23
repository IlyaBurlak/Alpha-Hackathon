
import { Request, Response, NextFunction, Router } from 'express';

export interface IApplicationController {
  router: Router;
  createApplication(req: Request, res: Response, next: NextFunction): Promise<void>
   
}