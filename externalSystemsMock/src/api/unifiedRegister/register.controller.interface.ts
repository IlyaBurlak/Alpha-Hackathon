
import { Request, Response, NextFunction } from 'express';

export interface IRegisterController {
  legal(req: Request, res: Response, next: NextFunction): Promise<void>
  invidual(req: Request, res: Response, next: NextFunction): Promise<void>
}