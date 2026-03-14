import { IsString, IsOptional, IsUrl, MaxLength } from "class-validator";

export class UpdateUserDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  lastName?: string;

  @IsUrl()
  @IsOptional()
  profilePicture?: string;
}
