import { ApplicationEntity } from "./entity/application.entity";


export interface IApplicationService {
  createApplication(application: ApplicationEntity ): Promise<ApplicationEntity>
  getApplicationById(id: number, userId: number): Promise<ApplicationEntity>;
  getApplicationByUserId(userId: number): Promise<ApplicationEntity[]>;
  
}