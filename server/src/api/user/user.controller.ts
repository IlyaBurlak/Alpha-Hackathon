
import 'reflect-metadata'; 
import { Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { BaseController } from '../common/base.controller';
import passport from '../../auth/passport.config';
import { IUserController } from './user.controller.interface';
import { IUserService } from './user.service.interface';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './dto/user.dto';

@injectable()
export class UserController extends BaseController implements IUserController {
  constructor(
    @inject(TYPES.userService) private userService: IUserService ,
  ) {
    super();
    this.bindRoute([
      {
        path: '/login',
        method: 'post',
        func: this.login,
        middleware: [] 
      },
      {
        path: '/info',
        method: 'get',
        func: this.getUserInfo,
        middleware: [passport.authenticate('jwt', { session: false })]
      }
     
    ]);
  }


  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Вход в систему
   *     description: Возвращает сообщение о входе в систему
   *     responses:
   *       200:
   *         description: Успешный ответ
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *                   example: "aaaaaa"
   */

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { login, password } = req.body;

      if (typeof login !== 'string' || typeof password !== 'string' || login.trim().length === 0 || password.length === 0) {
          res.status(400).json({ error: 'login и password обязательны' });
          return;
      }

      const user = await this.userService.login(login, password);
      const token = jwt.sign(
          { login: user.login, id: user.id }, 
          process.env.JWT_SECRET!,
          { expiresIn: '1d' }
      );
      
     res.json({ token });
      
    } catch (err) {
      next(err);
    }
  }

  async getUserInfo(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
          const login = (req.user as { login?: string } | undefined)?.login;
          if (!login) {
              res.status(401).json({ error: 'Unauthorized' });
              return;
          }
          const user = await this.userService.getUserByLogin(login);
          res.json(plainToInstance(UserDto, user));
         
      } catch (err) {
          next(err);
      }
  }

  
}