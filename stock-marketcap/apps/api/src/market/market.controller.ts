import { Controller, Get, Query } from "@nestjs/common";
import { MarketService } from "./market.service";

@Controller("market")
export class MarketController {
  constructor(private readonly market: MarketService) {}

  @Get("overview")
  getOverview() {
    return this.market.getOverview();
  }

  @Get("movers")
  getMovers(@Query("limit") limit?: string) {
    const n = limit ? Math.min(20, Math.max(1, parseInt(limit, 10) || 5)) : 5;
    return this.market.getMovers(n);
  }
}
