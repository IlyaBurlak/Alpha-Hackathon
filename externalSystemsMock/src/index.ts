import 'reflect-metadata'; // обязательно первой строкой
import express from 'express';
import path from 'node:path';
import 'dotenv/config';
import { container } from './container';
import { TYPES } from './types';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { BankController } from './api/bank/bank.controller';
import { CreditBureauController } from './api/creditBureau/bureau.controller';
import { RegisterController } from './api/unifiedRegister/register.controller';

const app = express();


(async () => {
  

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const bankController = container.get<BankController>(TYPES.bankController);
  const creditBureauController = container.get<CreditBureauController>(TYPES.creditBureauController);
  const registerController = container.get<RegisterController>(TYPES.registerController);

  (global as any).bureauisActive = true;
  (global as any).bankisActive = true;
  (global as any).registerisActive = true;

  app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(['/health', '/api/health'], (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use(`/api/banks`, bankController.router)
  app.use(`/api/credit-bureaus`, creditBureauController.router)
  app.use(`/api/register`, registerController.router)

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