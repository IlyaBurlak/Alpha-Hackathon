
import { Request, Response, NextFunction, Router } from 'express';

export interface IUserController {
  router: Router;
  login(req: Request, res: Response, next: NextFunction): Promise<void>
   
}