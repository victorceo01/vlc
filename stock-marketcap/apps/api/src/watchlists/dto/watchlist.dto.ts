import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateWatchlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}

export class RenameWatchlistDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name!: string;
}

export class AddWatchlistItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  symbol!: string;
}
