import { Module } from "@nestjs/common";
import { StocksModule } from "../stocks/stocks.module";
import { ScreenerController } from "./screener.controller";
import { ScreenerService } from "./screener.service";

@Module({
  imports: [StocksModule],
  controllers: [ScreenerController],
  providers: [ScreenerService],
})
export class ScreenerModule {}
