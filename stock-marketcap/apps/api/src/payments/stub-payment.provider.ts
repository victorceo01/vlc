import { Injectable } from "@nestjs/common";
import {
  InitTransactionParams,
  InitTransactionResult,
  PaymentProvider,
  VerifyTransactionResult,
} from "./payments.types";

/**
 * No-op payment provider for the MVP. It performs NO real charge and stores
 * NO card data. Used so the subscription/entitlement flow can be exercised
 * end-to-end without live billing.
 */
@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";

  async initializeTransaction(
    params: InitTransactionParams,
  ): Promise<InitTransactionResult> {
    return {
      provider: this.name,
      reference: params.reference,
      authorizationUrl: null,
      stubbed: true,
    };
  }

  async verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
    return {
      provider: this.name,
      reference,
      status: "stubbed",
      amountNgn: null,
    };
  }
}
