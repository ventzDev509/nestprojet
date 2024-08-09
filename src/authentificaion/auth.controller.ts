import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request,Response } from 'express';
import { LoginDto } from './dto/login-user-dto';
import { RegistrationDto } from './dto/regisration-dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
@ApiTags("Authantification module")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
@ApiOperation({summary:"Login with an username and a password"})
  @Post('/login')
  async login(@Req() request:Request,@Res() response:Response,@Body() data:LoginDto): Promise<any> {
    try {
        const result= await this.authService.login(data)
        return response.status(200).json(result)
    } catch (error) {
        return response.status(200).json(error)
    }
  }
  @ApiOperation({summary:"register a compte with a name,role,email,password"})
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
