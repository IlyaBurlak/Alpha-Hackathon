import { Container } from 'inversify';
import { TYPES } from './types';
import { IBankController } from './api/bank/bank.controller.interface';
import { BankController } from './api/bank/bank.controller';
import { ICreditBureauController } from './api/creditBureau/bureau.controller.interface';
import { IRegisterController } from './api/unifiedRegister/register.controller.interface';
import { CreditBureauController } from './api/creditBureau/bureau.controller';
import { RegisterController } from './api/unifiedRegister/register.controller';

const container = new Container();

container.bind<IBankController>(TYPES.bankController).to(BankController);
container.bind<ICreditBureauController>(TYPES.creditBureauController).to(CreditBureauController);
container.bind<IRegisterController>(TYPES.registerController).to(RegisterController);

export { container };