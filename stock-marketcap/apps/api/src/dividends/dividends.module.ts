import { Module } from "@nestjs/common";
import { DividendsController } from "./dividends.controller";

@Module({
  controllers: [DividendsController],
})
export class DividendsModule {}
