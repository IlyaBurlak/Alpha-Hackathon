import { Exclude, Type } from "class-transformer"
import { OrganizationDto } from "../../organizations/dto/organization.dto"

export class OperatorDto {

  id!: number
  login!: string
  fullName!: string
@Exclude()
  organizations!: OrganizationDto[]

  @Exclude()
  password!: string
}