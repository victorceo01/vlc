import { Global, Module } from "@nestjs/common";
import { FinancialsService } from "./financials.service";

@Global()
@Module({
  providers: [FinancialsService],
  exports: [FinancialsService],
})
export class FinancialsModule {}
