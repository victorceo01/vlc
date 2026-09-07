import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  isAdmin: boolean;
  tier: SubscriptionTier;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest();
    return req.user as AuthenticatedUser;
  },
);
