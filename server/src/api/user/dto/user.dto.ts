import { Exclude, Type } from "class-transformer"
import { OrganizationDto } from "../../organizations/dto/organization.dto"

export class UserDto {

  id!: number
  login!: string
  fullName!: string
    @Type(() => OrganizationDto)
  organizations!: OrganizationDto[]

  @Exclude()
  password!: string
}