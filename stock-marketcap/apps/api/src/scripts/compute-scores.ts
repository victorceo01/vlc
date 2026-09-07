/**
 * Standalone script: recompute + persist Stock Marketcap Scores for every
 * company, reusing the exact ScoreService logic used by the API. Run after
 * seeding: `pnpm scores:recompute`.
 */
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { ScoreService } from "../score/score.service";

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn"],
  });
  const scores = app.get(ScoreService);
  const result = await scores.recomputeAll();
  // eslint-disable-next-line no-console
  console.log(
    `Scores recomputed: ${result.computed} companies (${result.insufficient} insufficient data).`,
  );
  await app.close();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
