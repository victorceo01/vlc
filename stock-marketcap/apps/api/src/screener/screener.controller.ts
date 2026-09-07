import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import { MARKET_CAP_BANDS } from "@stockmc/shared";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import {
  AuthenticatedUser,
  CurrentUser,
} from "../common/decorators/current-user.decorator";
import { ScreenerService } from "./screener.service";
import { ScreenerQuery } from "./dto/screener.dto";

@Controller("screener")
export class ScreenerController {
  constructor(private readonly screener: ScreenerService) {}

  @Get("options")
  options() {
    return { marketCapBands: MARKET_CAP_BANDS };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  run(@Query() query: ScreenerQuery, @CurrentUser() user: AuthenticatedUser | undefined) {
    const tier = (user?.tier ?? SubscriptionTier.FREE) as unknown as SubscriptionTier;
    return this.screener.screen(query, tier);
  }
}
