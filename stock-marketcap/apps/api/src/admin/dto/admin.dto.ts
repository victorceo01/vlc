import { Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";
import { FinancialStatementType, SubscriptionTier } from "@prisma/client";

export class CreateCompanyDto {
  @IsString() @MaxLength(120) name!: string;
  @IsString() @MaxLength(60) sector!: string;
  @IsString() @MaxLength(20) symbol!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() ceo?: string;
  @IsOptional() @IsString() headquarters?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) listedShares?: number;
}

export class UpdateCompanyDto {
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() @MaxLength(60) sector?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() ceo?: string;
  @IsOptional() @IsString() headquarters?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) listedShares?: number;
}

export class UpsertPriceDto {
  @Type(() => Number) @IsNumber() @Min(0) priceNgn!: number;
  @IsOptional() @Type(() => Number) @IsNumber() changePct?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) volume?: number;
}

export class UpsertFinancialDto {
  @IsEnum(FinancialStatementType) type!: FinancialStatementType;
  @Type(() => Number) @IsInt() fiscalYear!: number;
  @IsObject() lineItems!: Record<string, number>;
}

export class UpdatePlanDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) priceMonthlyNgn?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) priceYearlyNgn?: number;
  @IsOptional() @IsObject() entitlements?: Record<string, unknown>;
}

export class PlanParam {
  @IsEnum(SubscriptionTier) tier!: SubscriptionTier;
}
