import { Injectable, Logger } from "@nestjs/common";

/**
 * MVP mail transport. In dev (MAIL_TRANSPORT=console) we log verification and
 * reset links to the API console instead of sending real email. A real SMTP
 * transport can be added behind this same interface later.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

  private send(to: string, subject: string, lines: string[]): void {
    const transport = process.env.MAIL_TRANSPORT ?? "console";
    if (transport === "console") {
      this.logger.log(
        `\n--- EMAIL (${transport}) ---\nTo: ${to}\nSubject: ${subject}\n${lines.join("\n")}\n---------------------------`,
      );
      return;
    }
    // Real transport not configured in MVP.
    this.logger.warn(`MAIL_TRANSPORT=${transport} not implemented; email to ${to} skipped`);
  }

  sendVerificationEmail(to: string, token: string): void {
    const link = `${this.webOrigin}/verify-email?token=${token}`;
    this.send(to, "Verify your Stock Marketcap email", [
      "Confirm your email address by opening this link:",
      link,
    ]);
  }

  sendPasswordResetEmail(to: string, token: string): void {
    const link = `${this.webOrigin}/reset-password?token=${token}`;
    this.send(to, "Reset your Stock Marketcap password", [
      "Reset your password using this link (valid for 1 hour):",
      link,
    ]);
  }
}
