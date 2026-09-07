import { Global, Module } from "@nestjs/common";
import { PAYMENT_PROVIDER } from "./payments.types";
import { StubPaymentProvider } from "./stub-payment.provider";
import { PaystackPaymentProvider } from "./paystack-payment.provider";

/**
 * Selects the payment provider from PAYMENTS_PROVIDER (default 'stub').
 * MVP uses the stub; 'paystack' resolves to a not-yet-enabled skeleton.
 */
@Global()
@Module({
  providers: [
    StubPaymentProvider,
    PaystackPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (stub: StubPaymentProvider, paystack: PaystackPaymentProvider) =>
        (process.env.PAYMENTS_PROVIDER ?? "stub") === "paystack" ? paystack : stub,
      inject: [StubPaymentProvider, PaystackPaymentProvider],
    },
  ],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
