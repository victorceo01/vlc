export const PAYMENT_PROVIDER = "PAYMENT_PROVIDER";

export interface InitTransactionParams {
  email: string;
  amountNgn: number;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface InitTransactionResult {
  provider: string;
  reference: string;
  authorizationUrl: string | null;
  /** True when this is a stub/no-op (no real charge occurred). */
  stubbed: boolean;
}

export interface VerifyTransactionResult {
  provider: string;
  reference: string;
  status: "success" | "failed" | "pending" | "stubbed";
  amountNgn: number | null;
}

/**
 * Payment provider abstraction. Implementations must NEVER store raw card data;
 * they only ever hold provider references/tokens. MVP ships a stub; a Paystack
 * (and later Flutterwave) implementation slots in behind this interface.
 */
export interface PaymentProvider {
  readonly name: string;
  initializeTransaction(params: InitTransactionParams): Promise<InitTransactionResult>;
  verifyTransaction(reference: string): Promise<VerifyTransactionResult>;
}
