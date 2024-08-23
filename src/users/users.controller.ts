import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
  Req,
  Res,
} from '@nestjs/common';
import { usersService } from './users.service';
import { Request, Response } from 'express';
import { Users } from './users.model';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

// Décorateur pour ajouter un tag Swagger à ce contrôleur
@ApiTags("Module utilisateur")
@Controller('users')
export class usersController {
  constructor(private readonly usersService: usersService) {}

  // Endpoint pour récupérer tous les utilisateurs
  @ApiOperation({summary:"Obtenir tous les utilisateurs"})
  @Get()
  async findAll(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    try { 
      const result = await this.usersService.findAll();

      if (Array.isArray(result)) {
        // Suppression du mot de passe de chaque utilisateur avant de renvoyer la réponse
        const sanitizedResult = result.map((user) => {
          const { password, ...sanitizedUser } = user;
          return sanitizedUser;
        });

        return response.status(200).json(sanitizedResult);
      } else {
        return response.status(200).json(result);
      }
    } catch (error) {
      // En cas d'erreur, renvoyer un message d'erreur
      return response
        .status(500)
        .json({ message: 'Une erreur est survenue', error });
    }
  }

  // Endpoint pour récupérer un utilisateur par son ID
  @ApiOperation({summary:"Obtenir un utilisateur par son ID"})
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const result = await this.usersService.findOne(+id);
      // Suppression du mot de passe avant de renvoyer la réponse
      delete result.password;
      return response.status(200).json(result);
    } catch (error) {
      // En cas d'erreur, renvoyer un message d'erreur
      return response
        .status(500)
        .json({ message: 'Une erreur est survenue', error });
    }
  }

  // Endpoint pour supprimer un utilisateur par son ID
  @ApiOperation({summary:"Supprimer un utilisateur par son ID"})
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}