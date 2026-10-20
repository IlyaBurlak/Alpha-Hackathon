import { Container } from 'inversify';
import { TYPES } from './types';
import { SupportController } from './api/support/support.controller';
import { SupportService } from './api/support/support.service';
import { SupportRepository } from './api/support/support.repository';
import { ISupportController } from './api/support/support.controller.interface';
import { ISupportService } from './api/support/support.service.interface';
import { ISupportRepository } from './api/support/support.repository.interface';

const container = new Container();

container.bind<ISupportController>(TYPES.supportController).to(SupportController);
container.bind<ISupportService>(TYPES.supportService).to(SupportService);
container.bind<ISupportRepository>(TYPES.supportRepository).to(SupportRepository);



export { container };