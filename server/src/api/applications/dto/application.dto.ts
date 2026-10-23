import { Exclude, Transform, Type } from "class-transformer"
import { OrganizationDto } from "../../organizations/dto/organization.dto"
import { IsEmpty, IsNotEmpty } from "class-validator";
import { ApplicationStatus, CreditTime, CreditTimeUnits } from "../entity/application.entity";

export class ApplicationCreateDto {
    @IsNotEmpty()
    organizationId!: number;
    @IsNotEmpty()
    sum!: number;
    @IsNotEmpty()
    creditTime!: CreditTime;

    @IsEmpty()
    id!: number;
    @IsEmpty()
    userId!: number;
    @IsEmpty()
    creditTimeUnits!: number;
    @IsEmpty()
    creditTimeUnitType!: number;
    @IsEmpty()
    status!: number;
    @IsEmpty()
    createdAt!: Date;
    @IsEmpty()
    loanIssuanceDate!: Date;
    
}

class ProductDto {
 
  @Type(() => CreditTimeDto)
  creditTime!: CreditTimeDto
}

class CreditTimeDto {
  value!: number
  @Transform(({ value }) => CreditTimeUnits[value as keyof typeof CreditTimeUnits] ?? value)

  units!: CreditTimeUnits
}

export class ApplicationDto {
    @Type(() => CreditTimeDto)
    creditTime!: CreditTimeDto;
    
    @Transform(({ value }) => ApplicationStatus[value as keyof typeof ApplicationStatus] ?? value)
    status!: number;

    @Type(() => ProductDto)
    products!: ProductDto[];
    
}