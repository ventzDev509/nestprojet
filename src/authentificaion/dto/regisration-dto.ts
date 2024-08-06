import { $Enums } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { TypeAcount } from "./type";


export class RegistrationDto{
    @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum($Enums.AccountType)
  @IsNotEmpty()
  role: $Enums.AccountType;
}