import { OrganizationEntity } from "../../organizations/entity/organization.entity";
import { ApplicationScoreEntity } from "./application.score.entity";

export enum CreditTimeUnits {
    DAY = 1,
    MONTH = 2,
    YEAR = 3
}

export class CreditTime{
    units!: CreditTimeUnits;
    value!: number;
}

export enum ApplicationStatus {
    DRAFT = 1,
    SUBMITTED = 2,
    APPROVED = 3,
    REJECTED = 4
}

export class ApplicationEntity {
    id!: number;
    userId!: number;
    organizationId!: number;
    sum!: number;
    productId!: number;
    product?: any;
    applicationScore?: ApplicationScoreEntity;
    status!: number;
    createdAt!: Date;
    creditTime: CreditTime;
    loanIssuanceDate!: Date;

    constructor(model: any) {
        this.id = model.id;
        this.userId = model.userId;
        this.organizationId = model.organizationId;
        this.sum = model.sum;
        this.status = model.status;
        this.createdAt = model.createdAt;
        this.creditTime = {
            units: model.creditTimeUnits,
            value: model.creditValue
        }
       
        if (model.applicationScore) {
            this.applicationScore = new ApplicationScoreEntity(model.applicationScore);
        }
        this.loanIssuanceDate = model.loanIssuanceDate;
        
    }
}