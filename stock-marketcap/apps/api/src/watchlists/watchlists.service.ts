import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../entitlements/entitlements.service";
import {
  MARKET_DATA_PROVIDER,
  MarketDataProvider,
} from "../market-data/market-data.types";

@Injectable()
export class WatchlistsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    @Inject(MARKET_DATA_PROVIDER)
    private readonly marketData: MarketDataProvider,
  ) {}

  private async assertOwnership(userId: string, watchlistId: string) {
    const wl = await this.prisma.watchlist.findUnique({ where: { id: watchlistId } });
    if (!wl) throw new NotFoundException("Watchlist not found");
    if (wl.userId !== userId) throw new ForbiddenException("Not your watchlist");
    return wl;
  }

  async list(userId: string, tier: SubscriptionTier) {
    const [watchlists, ent] = await Promise.all([
      this.prisma.watchlist.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        include: {
          items: {
            orderBy: { addedAt: "asc" },
            include: { security: { include: { company: true } } },
          },
        },
      }),
      this.entitlements.getEntitlements(tier),
    ]);

    const symbols = watchlists.flatMap((w) => w.items.map((i) => i.security.symbol));
    const quotes = await this.marketData.getQuotes(symbols.length ? symbols : undefined);
    const quoteBySymbol = new Map(quotes.map((q) => [q.symbol, q]));

    return {
      limits: {
        maxWatchlists: ent.maxWatchlists,
        maxWatchlistItems: ent.maxWatchlistItems,
      },
      watchlists: watchlists.map((w) => ({
        id: w.id,
        name: w.name,
        createdAt: w.createdAt.toISOString(),
        items: w.items.map((i) => {
          const q = quoteBySymbol.get(i.security.symbol);
          return {
            symbol: i.security.symbol,
            name: i.security.company.name,
            sector: i.security.company.sector,
            priceNgn: q?.priceNgn ?? null,
            changePct: q?.changePct ?? null,
            marketCapNgn: q?.marketCapNgn ?? null,
            source: q?.source ?? "mock",
            addedAt: i.addedAt.toISOString(),
          };
        }),
      })),
    };
  }

  async create(userId: string, tier: SubscriptionTier, name: string) {
    const ent = await this.entitlements.getEntitlements(tier);
    const count = await this.prisma.watchlist.count({ where: { userId } });
    if (count >= ent.maxWatchlists) {
      throw new ForbiddenException(
        `Your plan allows up to ${ent.maxWatchlists} watchlist(s). Upgrade to add more.`,
      );
    }
    return this.prisma.watchlist.create({ data: { userId, name } });
  }

  async rename(userId: string, watchlistId: string, name: string) {
    await this.assertOwnership(userId, watchlistId);
    return this.prisma.watchlist.update({ where: { id: watchlistId }, data: { name } });
  }

  async remove(userId: string, watchlistId: string) {
    await this.assertOwnership(userId, watchlistId);
    await this.prisma.watchlist.delete({ where: { id: watchlistId } });
    return { ok: true };
  }

  async addItem(
    userId: string,
    tier: SubscriptionTier,
    watchlistId: string,
    symbol: string,
  ) {
    await this.assertOwnership(userId, watchlistId);
    const ent = await this.entitlements.getEntitlements(tier);

    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);

    const count = await this.prisma.watchlistItem.count({ where: { watchlistId } });
    if (count >= ent.maxWatchlistItems) {
      throw new ForbiddenException(
        `Your plan allows up to ${ent.maxWatchlistItems} stocks per watchlist. Upgrade to add more.`,
      );
    }

    const existing = await this.prisma.watchlistItem.findUnique({
      where: { watchlistId_securityId: { watchlistId, securityId: security.id } },
    });
    if (existing) throw new BadRequestException("Already in this watchlist");

    await this.prisma.watchlistItem.create({
      data: { watchlistId, securityId: security.id },
    });
    return { ok: true };
  }

  async removeItem(userId: string, watchlistId: string, symbol: string) {
    await this.assertOwnership(userId, watchlistId);
    const security = await this.prisma.security.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });
    if (!security) throw new NotFoundException(`Unknown symbol ${symbol}`);
    await this.prisma.watchlistItem.deleteMany({
      where: { watchlistId, securityId: security.id },
    });
    return { ok: true };
  }
}
