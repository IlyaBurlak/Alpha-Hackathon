import { Container } from 'inversify';
import { TYPES } from './types';
import { SupportController } from './api/support/support.controller';
import { SupportService } from './api/support/support.service';
import { SupportRepository } from './api/support/support.repository';
import { ISupportController } from './api/support/support.controller.interface';
import { ISupportService } from './api/support/support.service.interface';
import { ISupportRepository } from './api/support/support.repository.interface';
import { UserRepository } from './api/user/user.repository';
import { IUserRepository } from './api/user/user.repository.interface';
import { UserService } from './api/user/user.service';
import { IUserService } from './api/user/user.service.interface';
import { UserController } from './api/user/user.controller';
import { IUserController } from './api/user/user.controller.interface';
import { IApplicationController } from './api/applications/application.controller.interface';
import { ApplicationController } from './api/applications/application.controller';
import { ApplicationService } from './api/applications/application.service';
import { ApplicationRepository } from './api/applications/application.repository';
import { IApplicationRepository } from './api/applications/application.repository.interface';
import { IApplicationService } from './api/applications/application.service.interface';

const container = new Container();

container.bind<ISupportController>(TYPES.supportController).to(SupportController);
container.bind<ISupportService>(TYPES.supportService).to(SupportService);
container.bind<ISupportRepository>(TYPES.supportRepository).to(SupportRepository);

container.bind<IUserController>(TYPES.userController).to(UserController);
container.bind<IUserService>(TYPES.userService).to(UserService);
container.bind<IUserRepository>(TYPES.userRepository).to(UserRepository);

container.bind<IApplicationController>(TYPES.applicationController).to(ApplicationController);
container.bind<IApplicationService>(TYPES.applicationService).to(ApplicationService);
container.bind<IApplicationRepository>(TYPES.applicationRepository).to(ApplicationRepository);

export { container };