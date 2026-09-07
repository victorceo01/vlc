import { Module, Provider } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MailService } from "./mail.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { GoogleStrategy, isGoogleConfigured } from "./strategies/google.strategy";

// Register the Google strategy only when OAuth credentials are configured,
// otherwise passport-google-oauth20 throws on construction.
const oauthProviders: Provider[] = isGoogleConfigured() ? [GoogleStrategy] : [];

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, MailService, JwtStrategy, ...oauthProviders],
  exports: [AuthService],
})
export class AuthModule {}
