import { Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class NearbyGymsQueryDto {
  /** "lat,lng" — point-based search. Takes precedence over `near`. */
  @IsOptional()
  @Matches(/^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/, {
    message: "ll must be a 'lat,lng' pair",
  })
  ll?: string;

  /** Free-text location (zip, city) — used when `ll` is absent. */
  @IsOptional()
  @IsString()
  near?: string;

  /** Search radius in metres (point search only). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(500)
  @Max(50000)
  radius?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
