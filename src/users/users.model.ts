import { $Enums, Prisma } from "@prisma/client";
import { TypeAcount } from "src/authentificaion/dto/type";



export class Users implements Prisma.UserCreateInput{
    id: number;
    name: string;
    email: string;
    password: string;
    role: $Enums.AccountType;
}