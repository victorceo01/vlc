import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  DataSource,
  FinancialPeriod,
  Prisma,
  SubscriptionTier,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdatePlanDto,
  UpsertFinancialDto,
  UpsertPriceDto,
} from "./dto/admin.dto";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { subscription: true },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      emailVerified: u.emailVerified,
      isAdmin: u.isAdmin,
      tier: u.subscription?.tier ?? SubscriptionTier.FREE,
      createdAt: u.createdAt.toISOString(),
    }));
  }

  async listCompanies() {
    const companies = await this.prisma.company.findMany({
      orderBy: { name: "asc" },
      include: { securities: { include: { currentPrice: true } } },
    });
    return companies.map((c) => ({
      id: c.id,
      name: c.name,
      sector: c.sector,
      symbol: c.securities[0]?.symbol ?? null,
      priceNgn: c.securities[0]?.currentPrice?.priceNgn.toNumber() ?? null,
      source: c.securities[0]?.currentPrice?.source ?? null,
    }));
  }

  async createCompany(dto: CreateCompanyDto) {
    const symbol = dto.symbol.toUpperCase();
    const existing = await this.prisma.security.findUnique({ where: { symbol } });
    if (existing) throw new BadRequestException(`Symbol ${symbol} already exists`);
    const company = await this.prisma.company.create({
      data: {
        name: dto.name,
        sector: dto.sector,
        description: dto.description ?? "",
        ceo: dto.ceo,
        headquarters: dto.headquarters,
        website: dto.website,
        securities: {
          create: {
            symbol,
            exchange: "NGX",
            currency: "NGN",
            listedShares: BigInt(dto.listedShares ?? 0),
          },
        },
      },
      include: { securities: true },
    });
    return company;
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: { securities: true },
    });
    if (!company) throw new NotFoundException("Company not found");
    const updated = await this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        sector: dto.sector,
        description: dto.description,
        ceo: dto.ceo,
        headquarters: dto.headquarters,
        website: dto.website,
      },
    });
    if (dto.listedShares !== undefined && company.securities[0]) {
      await this.prisma.security.update({
        where: { id: company.securities[0].id },
        data: { listedShares: BigInt(dto.listedShares) },
      });
    }
    return updated;
  }

  async upsertPrice(symbol: string, dto: UpsertPriceDto) {
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);
    return this.prisma.price.upsert({
      where: { securityId: security.id },
      create: {
        securityId: security.id,
        priceNgn: dto.priceNgn,
        changePct: dto.changePct ?? 0,
        volume: BigInt(dto.volume ?? 0),
        source: DataSource.mock, // admin-entered data is still labeled mock in the MVP
        timestamp: new Date(),
      },
      update: {
        priceNgn: dto.priceNgn,
        changePct: dto.changePct ?? 0,
        volume: BigInt(dto.volume ?? 0),
        source: DataSource.mock,
        timestamp: new Date(),
      },
    });
  }

  async upsertFinancial(companyId: string, dto: UpsertFinancialDto) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    if (!company) throw new NotFoundException("Company not found");
    return this.prisma.financialStatement.upsert({
      where: {
        companyId_type_period_fiscalYear: {
          companyId,
          type: dto.type,
          period: FinancialPeriod.annual,
          fiscalYear: dto.fiscalYear,
        },
      },
      create: {
        companyId,
        type: dto.type,
        period: FinancialPeriod.annual,
        fiscalYear: dto.fiscalYear,
        currency: "NGN",
        lineItems: dto.lineItems,
        source: DataSource.mock,
        timestamp: new Date(Date.UTC(dto.fiscalYear, 11, 31)),
      },
      update: {
        lineItems: dto.lineItems,
        source: DataSource.mock,
        timestamp: new Date(Date.UTC(dto.fiscalYear, 11, 31)),
      },
    });
  }

  async updatePlan(tier: SubscriptionTier, dto: UpdatePlanDto) {
    const plan = await this.prisma.planSetting.findUnique({ where: { tier } });
    if (!plan) throw new NotFoundException(`Plan ${tier} not found`);
    const updated = await this.prisma.planSetting.update({
      where: { tier },
      data: {
        displayName: dto.displayName,
        priceMonthlyNgn: dto.priceMonthlyNgn,
        priceYearlyNgn: dto.priceYearlyNgn,
        entitlements: dto.entitlements
          ? (dto.entitlements as Prisma.InputJsonValue)
          : undefined,
      },
    });
    await this.entitlements.invalidate();
    return updated;
  }
}
