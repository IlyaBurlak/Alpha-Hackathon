import { Transform, Type } from "class-transformer"
import { OrganizationType } from "../entity/organization.entity"

export class OrganizationDto {
    id!: number
    inn!: string
    fullName!: string

    @Transform(({ value }) => OrganizationType[value as keyof typeof OrganizationType] ?? value)
    type!: OrganizationType 
}