import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AuthenticatedUser } from "../../common/decorators/current-user.decorator";

/** Use AFTER JwtAuthGuard. Requires the authenticated user to be an admin. */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as AuthenticatedUser | undefined;
    if (!user?.isAdmin) {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}
