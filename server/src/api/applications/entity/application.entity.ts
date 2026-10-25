import { OrganizationEntity } from "../../organizations/entity/organization.entity";
import { UserEntity } from "../../user/entity/user.entity";
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
    REJECTED = 4,
    SPECIALPRODUCTOFFERED = 5,
    SPECIALPRODUCTACCEPTED = 6,
    SPECIALPRODUCTREJECTED = 7
}

export class ApplicationEntity {
    id!: number;
    userId!: number;
    organizationId!: number;
    sum!: number;
    productId!: number;
    product?: any;
    applicationScore?: ApplicationScoreEntity;
    organization?: OrganizationEntity;
    status!: number;
    createdAt!: Date;
    creditTime: CreditTime;
    loanIssuanceDate!: Date;
    solutionComment!: string;
    operatorId!: number;
    operator?: UserEntity;

    constructor(model: any) {
        this.id = model.id;
        this.userId = model.userId;
        this.organizationId = model.organizationId;
        this.sum = model.sum;
        this.status = model.status;
        this.createdAt = model.createdAt;
        this.solutionComment = model.solutionComment;
        this.operatorId = model.operatorId;
        this.creditTime = {
            units: model.creditTimeUnits,
            value: model.creditValue
        }
       
        if (model.applicationScore) {
            this.applicationScore = new ApplicationScoreEntity(model.applicationScore);
        }
        if (model.productId) {
            this.productId = model.productId;
            this.product = model.productConditions;
        }
        if (model.operator) {
            this.operator = new UserEntity(model.operator);
        }
        if (model.organization) {
            this.organization = new OrganizationEntity(model.organization);
        }
        this.loanIssuanceDate = model.loanIssuanceDate;
        
    }
}