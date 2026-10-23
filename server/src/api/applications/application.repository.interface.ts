import { ApplicationEntity } from "./entity/application.entity";
import { Transaction } from "sequelize";
import { AnalysisStatus, MlScoreEntity } from "./entity/application.score.entity";

export interface IApplicationRepository {
    createApplication(application: ApplicationEntity, transaction?: Transaction): Promise<ApplicationEntity>;
    getApplicationById(id: number, transaction?: Transaction): Promise<ApplicationEntity>;
    getApplicationByUserId(userId: number): Promise<ApplicationEntity[]>;
    confirmApplication(applicationId: number, product: any, transaction?: Transaction): Promise<ApplicationEntity>;
    updateApplicationScoringStatus(applicationScoreId: number, status: AnalysisStatus): Promise<void> 
    updateApplicationScoringInfo(applicationScoreId: number, info: any): Promise<void>;
    updateApplicationScore(applicationId: number, info: MlScoreEntity): Promise<void>
    getApplicationWithScore (id: number, transaction?: Transaction): Promise<ApplicationEntity>;
    createApplicationScore(applicationId: number): Promise<void>;
}