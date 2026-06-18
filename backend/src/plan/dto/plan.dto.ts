import { IsArray, IsObject } from "class-validator";
import type {
  AppData,
  ChatMessage,
  UserPlanPayload,
} from "../plan.types";

/**
 * The client sends the whole plan as one blob. We validate only the top-level
 * shape here; the mapper is tolerant of missing nested fields.
 */
export class PlanPayloadDto implements UserPlanPayload {
  @IsObject()
  appData!: AppData;

  @IsArray()
  coachChat!: ChatMessage[];

  @IsArray()
  onboardingChat!: ChatMessage[];
}
