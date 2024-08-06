import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request,Response } from 'express';
import { LoginDto } from './dto/login-user-dto';
import { RegistrationDto } from './dto/regisration-dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(@Req() request:Request,@Res() response:Response,@Body() data:LoginDto): Promise<any> {
    try {
        const result= await this.authService.login(data)
        return response.status(200).json(result)
    } catch (error) {
        return response.status(200).json(error)
    }
  }
  @Post('/register')
  async register(@Req() request:Request,@Res() response:Response,@Body() data:RegistrationDto): Promise<any> {
    try {
        const result=await this.authService.register(data)
        return response.status(200).json(result)
    } catch (error) {
        return response.status(200).json(error)
    }
  }
}
