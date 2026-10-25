
import { Request, Response, NextFunction } from 'express';

export interface IBankController {
  getProducts(req: Request, res: Response, next: NextFunction): Promise<void> 
   
}