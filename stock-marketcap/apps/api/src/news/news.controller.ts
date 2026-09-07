import { Controller, Get, Param, Query } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Controller("news")
export class NewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(
    @Query("symbol") symbol?: string,
    @Query("sector") sector?: string,
    @Query("page") pageStr?: string,
    @Query("pageSize") pageSizeStr?: string,
  ) {
    const page = Math.max(1, parseInt(pageStr ?? "1", 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(pageSizeStr ?? "20", 10) || 20));

    const where: Prisma.NewsArticleWhereInput = {};
    if (symbol) {
      where.companies = {
        some: { company: { securities: { some: { symbol: symbol.toUpperCase() } } } },
      };
    } else if (sector) {
      where.companies = { some: { company: { sector } } };
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.newsArticle.count({ where }),
      this.prisma.newsArticle.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          companies: {
            include: { company: { include: { securities: { select: { symbol: true } } } } },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      source: "mock",
      data: rows.map((a) => ({
        id: a.id,
        title: a.title,
        summary: a.summary,
        sourceName: a.sourceName,
        publishedAt: a.publishedAt.toISOString(),
        source: a.source,
        tickers: a.companies.flatMap((c) => c.company.securities.map((s) => s.symbol)),
      })),
    };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const a = await this.prisma.newsArticle.findUnique({
      where: { id },
      include: {
        companies: {
          include: { company: { include: { securities: { select: { symbol: true } } } } },
        },
      },
    });
    if (!a) return null;
    return {
      id: a.id,
      title: a.title,
      summary: a.summary,
      body: a.body,
      sourceName: a.sourceName,
      url: a.url,
      publishedAt: a.publishedAt.toISOString(),
      source: a.source,
      tickers: a.companies.flatMap((c) => c.company.securities.map((s) => s.symbol)),
    };
  }
}
