import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Controller("dividends")
export class DividendsController {
  constructor(private readonly prisma: PrismaService) {}

  // Declared dividends only (no forecasting in MVP).
  @Get(":symbol")
  async getForSymbol(@Param("symbol") symbol: string) {
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
      select: { companyId: true },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);

    const rows = await this.prisma.dividend.findMany({
      where: { companyId: security.companyId },
      orderBy: [{ fiscalYear: "desc" }, { paymentDate: "desc" }],
    });

    return {
      symbol: symbol.toUpperCase(),
      source: "mock",
      dividends: rows.map((d) => ({
        fiscalYear: d.fiscalYear,
        amountPerShareNgn: (d.amountPerShareNgn as Prisma.Decimal).toNumber(),
        type: d.type,
        declaredDate: d.declaredDate?.toISOString().slice(0, 10) ?? null,
        exDate: d.exDate?.toISOString().slice(0, 10) ?? null,
        paymentDate: d.paymentDate?.toISOString().slice(0, 10) ?? null,
        source: d.source,
      })),
    };
  }
}
