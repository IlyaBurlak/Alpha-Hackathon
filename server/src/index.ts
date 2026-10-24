import 'reflect-metadata'; 
import express from 'express';
import path from 'node:path';
import 'dotenv/config';
import { container } from './container';
import { TYPES } from './types';
import { sequelize } from './database/dbconfig';
import { BdCongigClass } from './database/dbprepare';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { IApplicationController } from './api/applications/application.controller.interface';
import { IUserController } from './api/user/user.controller.interface';

const app = express();


(async () => {
  
  BdCongigClass.prepareModels();
  await sequelize.sync();
  await BdCongigClass.prepareStartData()
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));


  const userController = container.get<IUserController>(TYPES.userController);
  const applicationController = container.get<IApplicationController>(TYPES.applicationController);
  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(`/api/users`, userController.router)
  app.use(`/api/applications`, applicationController.router)


  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });

  if (!process.env.PORT) {
    throw new Error("Не указан PORT в настройках. Проверьте env файл")
  }

  app.listen(process.env.PORT, () => {
    console.log(`Сервер запущен на http://localhost:${process.env.PORT}`);
  });
})();