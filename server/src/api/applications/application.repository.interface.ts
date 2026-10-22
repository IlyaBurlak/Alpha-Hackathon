import { ApplicationEntity } from "./entity/application.entity";

export interface IApplicationRepository {
 
 createApplication(application: ApplicationEntity): Promise<ApplicationEntity>;
 getApplicationById(id: number): Promise<ApplicationEntity>;
 getApplicationByUserId(userId: number): Promise<ApplicationEntity[]>;
}