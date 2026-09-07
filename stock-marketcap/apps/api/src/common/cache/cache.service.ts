import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

/**
 * Thin Redis wrapper with graceful degradation: if Redis is unavailable the
 * app keeps working (cache becomes a no-op). Used for market overview and
 * entitlement lookups.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  private healthy = false;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn("REDIS_URL not set — caching disabled");
      return;
    }
    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't spin forever in dev
    });
    this.client.on("error", (err) => {
      if (this.healthy) this.logger.warn(`Redis error: ${err.message}`);
      this.healthy = false;
    });
    this.client
      .connect()
      .then(() => {
        this.healthy = true;
        this.logger.log("Redis connected");
      })
      .catch((err) => this.logger.warn(`Redis unavailable: ${err.message}`));
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.healthy) return null;
    try {
      const raw = await this.client.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 30): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      await this.client.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch {
      /* ignore cache write failures */
    }
  }

  async del(pattern: string): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length) await this.client.del(...keys);
    } catch {
      /* ignore */
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.quit().catch(() => undefined);
  }
}
