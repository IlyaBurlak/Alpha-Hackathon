import { ApplicationEntity } from "../applications/entity/application.entity";
import { OrganizationType } from "../organizations/entity/organization.entity";


export interface IGatewayService {
   getBanksProducts(): Promise<any>;
   getCreditBureauHistory(inn: string): Promise<any>;
   getRegisterInfo(inn: string, type: OrganizationType): Promise<any>; 
   getMlScoring (applicationData: ApplicationEntity): Promise<any>;
}