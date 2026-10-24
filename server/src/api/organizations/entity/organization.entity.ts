export enum OrganizationType {
    OO = 1,
    IndividualEntrepreneur = 2
}

export class OrganizationEntity {
    inn: string
    ogrn: string
    head: string | null
    account: string
    address: string | null
    fullName: string
    type: OrganizationType
    id: number

    constructor(model: any) {
        this.inn = model.inn;
        this.ogrn = model.ogrn;
        this.head = model.head;
        this.account = model.account;
        this.address = model.address;
        this.fullName = model.fullName;
        this.type = model.type;
        this.id = model.id;

    }
}