
import { Request, Response, NextFunction } from 'express';

export interface ICreditBureauController {
  getCreditHistory(req: Request, res: Response, next: NextFunction): Promise<void> 
   
}