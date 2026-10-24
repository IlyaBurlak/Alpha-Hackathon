import { OrganizationEntity } from "../../organizations/entity/organization.entity";

export class UserEntity {
    login!: string;
    fullName!: string;
    password!: string;
    organizations!: OrganizationEntity[]
    id!: number;

    constructor(model: any) {
        if (model)
        {
            this.login = model.login;
            this.fullName = model.fullName;
            this.organizations = model.Organizations ? model.Organizations.map((org: any) => new OrganizationEntity(org)) : [];
            this.password = model.password;
            this.id = model.id;
        }
    }
}