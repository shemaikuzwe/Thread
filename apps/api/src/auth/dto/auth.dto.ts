import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from "class-validator";

export class RegisterDto {
  @IsString()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class GoogleCallbackDto {
  @IsString()
  code: string;
}
