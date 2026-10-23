import { ApplicationEntity } from "./entity/application.entity";
import { Transaction } from "sequelize";

export interface IApplicationRepository {
 
 createApplication(application: ApplicationEntity, transaction?: Transaction): Promise<ApplicationEntity>;
 getApplicationById(id: number, transaction?: Transaction): Promise<ApplicationEntity>;
 getApplicationByUserId(userId: number): Promise<ApplicationEntity[]>;
 confirmApplication(applicationId: number, product: any, transaction?: Transaction): Promise<ApplicationEntity>;
}