import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from "@nestjs/common";
import { CompareGymsDto } from "./dto/compare-gyms.dto";
import { NearbyGymsQueryDto } from "./dto/nearby-gyms.dto";
import {
  CompareResponse,
  GymsService,
  NearbyGymsResponse,
} from "./gyms.service";

// Public, unauthenticated discovery + comparison for the frontend gym finder.
@Controller("gyms")
export class GymsController {
  constructor(private readonly gyms: GymsService) {}

  @Get("nearby")
  nearby(@Query() query: NearbyGymsQueryDto): Promise<NearbyGymsResponse> {
    if (!query.ll && !query.near) {
      throw new BadRequestException("Provide either 'll' or 'near'.");
    }
    return this.gyms.nearby(query);
  }

  @Post("compare")
  compare(@Body() body: CompareGymsDto): Promise<CompareResponse> {
    return this.gyms.compare(body.gyms);
  }
}
