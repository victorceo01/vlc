import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { PriceChartRange, SubscriptionTier } from "@stockmc/shared";
import { StocksService } from "./stocks.service";
import { ChartQueryDto, StockListQueryDto } from "./dto/stock-query.dto";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import {
  AuthenticatedUser,
  CurrentUser,
} from "../common/decorators/current-user.decorator";
import { EntitlementsService } from "../entitlements/entitlements.service";

@Controller("stocks")
export class StocksController {
  constructor(
    private readonly stocks: StocksService,
    private readonly entitlements: EntitlementsService,
  ) {}

  @Get()
  list(@Query() query: StockListQueryDto) {
    return this.stocks.list(query);
  }

  @Get(":symbol")
  @UseGuards(OptionalJwtAuthGuard)
  async getOne(
    @Param("symbol") symbol: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
  ) {
    // Score breakdown is a gated (server-side) entitlement.
    const tier = (user?.tier ?? SubscriptionTier.FREE) as unknown as import("@prisma/client").SubscriptionTier;
    const ent = await this.entitlements.getEntitlements(tier);
    return this.stocks.getBySymbol(symbol, ent.scoreBreakdown);
  }

  @Get(":symbol/chart")
  getChart(@Param("symbol") symbol: string, @Query() query: ChartQueryDto) {
    return this.stocks.getChart(symbol, query.range ?? PriceChartRange.ONE_YEAR);
  }

  @Get(":symbol/financials")
  getFinancials(@Param("symbol") symbol: string) {
    return this.stocks.getFinancials(symbol);
  }
}
