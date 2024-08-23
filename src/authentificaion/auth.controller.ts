import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { LoginDto } from './dto/login-user-dto';
import { RegistrationDto } from './dto/regisration-dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

// Décorateur pour ajouter un tag Swagger à ce contrôleur
@ApiTags("Module d'authentification")
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoint pour la connexion
  @ApiOperation({summary: "Connexion avec un nom d'utilisateur et un mot de passe"})
  @Post('/login')
  async login(@Req() request: Request, @Res() response: Response, @Body() data: LoginDto): Promise<any> {
    try {
      // Appel du service d'authentification pour la connexion
      const result = await this.authService.login(data)
      return response.status(200).json(result)
    } catch (error) {
      // En cas d'erreur, renvoyer l'erreur avec un statut 200 (à revoir)
      return response.status(200).json(error)
    }
  }

  // Endpoint pour l'inscription
  @ApiOperation({summary: "Inscription d'un compte avec un nom, rôle, email, mot de passe"})
  @Post('/register')
  async register(@Req() request: Request, @Res() response: Response, @Body() data: RegistrationDto): Promise<any> {
    try {
      // Appel du service d'authentification pour l'inscription
      const result = await this.authService.register(data)
      return response.status(200).json(result)
    } catch (error) {
      // En cas d'erreur, renvoyer l'erreur avec un statut 200 (à revoir)
      return response.status(200).json(error)
    }
  }
}