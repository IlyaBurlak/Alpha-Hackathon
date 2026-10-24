import { ApplicationStatus, CreditTime } from "./application.entity";

export class ProductEntity {
    public id!: number;
    public name!: string;
    public sum!: any;
    public collateral!: any;
    public payments!: any;
    public persentage!: any;
    public creditTime!: CreditTime;
}

export class OperatorSolution {
    status!: ApplicationStatus;
    comment!: string;
    product!: ProductEntity;
}