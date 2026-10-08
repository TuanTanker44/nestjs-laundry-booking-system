import { IsEmail, IsNotEmpty, IsString, Max, Min } from "class-validator";

export class RegisterDto {
  @IsNotEmpty()  
  @IsEmail()
  email: string;

  @IsNotEmpty()  
  @IsString()
  @Min(8)
  @Max(72)
  password: string;

  @IsString()
  @Max(36)
  name: string;
}