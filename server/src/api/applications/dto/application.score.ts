
import { Transform } from "class-transformer";
import { AnalysisStatus } from "../entity/application.score.entity";
import { IsOptional } from "class-validator/types/decorator/common/IsOptional";

export class ApplicationScoreDto {
    
    @Transform(({ value }) => AnalysisStatus[value as keyof typeof AnalysisStatus] ?? value)
    status!: number;

}