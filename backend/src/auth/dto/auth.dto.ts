import { IsEmail, IsString, MinLength } from "class-validator";

export class SignUpDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6, { message: "Password should be at least 6 characters" })
  password!: string;
}

export class SignInDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class GoogleSignInDto {
  @IsString()
  idToken!: string;
}
