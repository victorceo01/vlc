import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CacheModule } from "./common/cache/cache.module";
import { MarketDataModule } from "./market-data/market-data.module";
import { EntitlementsModule } from "./entitlements/entitlements.module";
import { FinancialsModule } from "./financials/financials.module";
import { PaymentsModule } from "./payments/payments.module";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { MarketModule } from "./market/market.module";
import { StocksModule } from "./stocks/stocks.module";
import { DividendsModule } from "./dividends/dividends.module";
import { WatchlistsModule } from "./watchlists/watchlists.module";
import { NewsModule } from "./news/news.module";
import { ScreenerModule } from "./screener/screener.module";
import { SubscriptionsModule } from "./subscriptions/subscriptions.module";
import { AdminModule } from "./admin/admin.module";
import { ScoreModule } from "./score/score.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global infrastructure
    PrismaModule,
    CacheModule,
    MarketDataModule,
    EntitlementsModule,
    FinancialsModule,
    PaymentsModule,
    // Feature modules (built in MVP feature order)
    AuthModule,
    MarketModule,
    StocksModule,
    DividendsModule,
    WatchlistsModule,
    NewsModule,
    ScreenerModule,
    SubscriptionsModule,
    AdminModule,
    ScoreModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
