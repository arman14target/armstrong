import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class ListAdminGymsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 24;

  @IsOptional()
  @IsString()
  search?: string;
}

export class UpdateGymDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  website?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  quietTimes?: string | null;
}

export class CreatePricePlanDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  priceText!: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  period?: string | null;
}

export class UpdatePricePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  priceText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  period?: string | null;
}

export class CreateAmenityDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name!: string;
}
