import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsEnum } from "class-validator";
import { SubscriptionTier } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  AuthenticatedUser,
  CurrentUser,
} from "../common/decorators/current-user.decorator";
import { SubscriptionsService } from "./subscriptions.service";

class SetTierDto {
  @IsEnum(SubscriptionTier)
  tier!: SubscriptionTier;
}

@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  @Get("plans")
  getPlans() {
    return this.subs.getPlans();
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.subs.getMine(user.id);
  }

  // Fake upgrade/downgrade toggle for testing (no real billing in MVP).
  @Post("change")
  @UseGuards(JwtAuthGuard)
  change(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetTierDto) {
    return this.subs.setTier(user.id, dto.tier);
  }
}
