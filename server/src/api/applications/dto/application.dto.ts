import { Exclude, Transform, Type } from "class-transformer"
import { OrganizationDto } from "../../organizations/dto/organization.dto"
import { IsEmpty, IsNotEmpty, IsOptional } from "class-validator";
import { ApplicationStatus, CreditTime, CreditTimeUnits } from "../entity/application.entity";
import { ApplicationScoreDto } from "./application.score";
import { UserEntity } from "../../user/entity/user.entity";
import { UserDto } from "../../user/dto/user.dto";
import { OperatorDto } from "../../user/dto/operator.dto";

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

    @IsOptional()
    @Type(() => ProductDto)
    products!: ProductDto[];

    @IsOptional()
    @Type(() => ApplicationScoreDto)
    applicationScore!: ApplicationScoreDto;

    @Type(()=> OperatorDto)
    operator!: OperatorDto;
    
}