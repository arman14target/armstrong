import { IsEmail, IsString } from "class-validator";

export class AdminSignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
