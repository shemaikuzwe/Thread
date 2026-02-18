import { IsString, IsBoolean, IsEnum, IsOptional, IsUUID, MaxLength } from "class-validator";
import { ThreadType } from "@thread/db/schema";

export class CreateThreadDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsEnum(["group", "dm"])
  type: ThreadType;
}

export class CreateDMDto {
  @IsUUID()
  userId: string;
}

export class JoinThreadDto {
  @IsUUID()
  threadId: string;
}
