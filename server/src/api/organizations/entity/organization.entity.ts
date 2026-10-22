export enum OrganizationType {
    OO = 1,
    IndividualEntrepreneur = 2
}

export class OrganizationEntity {
    inn: string
    fullName: string
    type: OrganizationType
    id: number

    constructor(model: any) {
        this.inn = model.inn;
        this.fullName = model.fullName;
        this.type = model.type;
        this.id = model.id;

    }
}