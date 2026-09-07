import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    // Feature modules are registered here as they are built:
    // AuthModule, MarketModule, StocksModule, DividendsModule,
    // WatchlistsModule, NewsModule, ScreenerModule, SubscriptionsModule,
    // ScoreModule, AdminModule.
  ],
  controllers: [HealthController],
})
export class AppModule {}
