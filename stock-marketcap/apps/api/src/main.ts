import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

// Prisma returns BigInt for some columns (volume, listedShares). JSON.stringify
// cannot serialize BigInt by default, so emit them as numbers in API responses.
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this as unknown as bigint);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });

  const prefix = process.env.API_GLOBAL_PREFIX ?? "api/v1";
  app.setGlobalPrefix(prefix);

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`[stockmc-api] listening on http://localhost:${port}/${prefix}`);
}

void bootstrap();
