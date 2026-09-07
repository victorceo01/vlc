import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SubscriptionTier } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  AuthenticatedUser,
  CurrentUser,
} from "../common/decorators/current-user.decorator";
import { WatchlistsService } from "./watchlists.service";
import {
  AddWatchlistItemDto,
  CreateWatchlistDto,
  RenameWatchlistDto,
} from "./dto/watchlist.dto";

@Controller("watchlists")
@UseGuards(JwtAuthGuard)
export class WatchlistsController {
  constructor(private readonly watchlists: WatchlistsService) {}

  private tier(user: AuthenticatedUser): SubscriptionTier {
    return user.tier as unknown as SubscriptionTier;
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.watchlists.list(user.id, this.tier(user));
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWatchlistDto) {
    return this.watchlists.create(user.id, this.tier(user), dto.name);
  }

  @Patch(":id")
  rename(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: RenameWatchlistDto,
  ) {
    return this.watchlists.rename(user.id, id, dto.name);
  }

  @Delete(":id")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.watchlists.remove(user.id, id);
  }

  @Post(":id/items")
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AddWatchlistItemDto,
  ) {
    return this.watchlists.addItem(user.id, this.tier(user), id, dto.symbol);
  }

  @Delete(":id/items/:symbol")
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Param("symbol") symbol: string,
  ) {
    return this.watchlists.removeItem(user.id, id, symbol);
  }
}
