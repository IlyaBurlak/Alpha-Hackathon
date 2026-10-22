import { Router, Request, Response, NextFunction } from 'express';
import { IMiddleware } from './middleware.interface';

export interface RouteDefinition {
  path: string;
  method: 'get' | 'post' | 'put' | 'delete' | 'patch';
  func: (req: Request, res: Response, next: NextFunction) => Promise<void>;
  middleware?: IMiddleware[];
}

export abstract class BaseController {
  public readonly router: Router = Router();

  protected bindRoute(routes: RouteDefinition[]): void {
    for (const route of routes) {
      const handler = route.func.bind(this);
      const middleware: any[] = route.middleware ?? [];
      this.router[route.method](route.path, ...middleware, handler);
    }
  }

  protected ok<T>(res: Response, data?: T): void {
    res.status(200).json(data ?? { success: true });
  }

  protected error(res: Response, message: string, code = 500): void {
    res.status(code).json({ error: message });
  }
}