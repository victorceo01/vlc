import { Global, Module } from "@nestjs/common";
import { DbMockMarketDataProvider } from "./db-mock.provider";
import { MARKET_DATA_PROVIDER } from "./market-data.types";

/**
 * Binds the MarketDataProvider interface to its single MVP implementation.
 * Swap the `useClass` here to introduce a live provider later.
 */
@Global()
@Module({
  providers: [
    DbMockMarketDataProvider,
    { provide: MARKET_DATA_PROVIDER, useClass: DbMockMarketDataProvider },
  ],
  exports: [MARKET_DATA_PROVIDER],
})
export class MarketDataModule {}
