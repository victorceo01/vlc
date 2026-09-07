import { Injectable, NotImplementedException } from "@nestjs/common";
import {
  InitTransactionParams,
  InitTransactionResult,
  PaymentProvider,
  VerifyTransactionResult,
} from "./payments.types";

/**
 * Paystack provider skeleton. Live billing is intentionally NOT wired up in the
 * MVP (per scope). The class exists so the integration can be completed later
 * without touching callers. It must only ever exchange references/tokens with
 * Paystack — never store raw card data.
 */
@Injectable()
export class PaystackPaymentProvider implements PaymentProvider {
  readonly name = "paystack";
  private readonly secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async initializeTransaction(_params: InitTransactionParams): Promise<InitTransactionResult> {
    throw new NotImplementedException(
      "Paystack live billing is not enabled in the MVP. Set PAYMENTS_PROVIDER=stub.",
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async verifyTransaction(_reference: string): Promise<VerifyTransactionResult> {
    throw new NotImplementedException(
      "Paystack live billing is not enabled in the MVP. Set PAYMENTS_PROVIDER=stub.",
    );
  }
}
