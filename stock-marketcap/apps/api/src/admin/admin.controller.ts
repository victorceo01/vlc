import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AdminService } from "./admin.service";
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  UpdatePlanDto,
  UpsertFinancialDto,
  UpsertPriceDto,
} from "./dto/admin.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("users")
  listUsers() {
    return this.admin.listUsers();
  }

  @Get("companies")
  listCompanies() {
    return this.admin.listCompanies();
  }

  @Post("companies")
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.admin.createCompany(dto);
  }

  @Patch("companies/:id")
  updateCompany(@Param("id") id: string, @Body() dto: UpdateCompanyDto) {
    return this.admin.updateCompany(id, dto);
  }

  @Put("securities/:symbol/price")
  upsertPrice(@Param("symbol") symbol: string, @Body() dto: UpsertPriceDto) {
    return this.admin.upsertPrice(symbol, dto);
  }

  @Put("companies/:id/financials")
  upsertFinancial(@Param("id") id: string, @Body() dto: UpsertFinancialDto) {
    return this.admin.upsertFinancial(id, dto);
  }

  @Patch("plans/:tier")
  updatePlan(@Param("tier") tier: SubscriptionTier, @Body() dto: UpdatePlanDto) {
    return this.admin.updatePlan(tier, dto);
  }
}
