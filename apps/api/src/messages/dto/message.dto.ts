import { IsString, IsUUID, IsOptional } from "class-validator";

export class CreateMessageDto {
  @IsUUID()
  threadId: string;

  @IsString()
  message: string;
}

export class UpdateLastReadDto {
  @IsUUID()
  messageId: string;
}
