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
@Controller('users')
export class usersController {
  constructor(private readonly usersService: usersService) {}
  @Get()
  async findAll(
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<any> {
    try {
      const result = await this.usersService.findAll();

      if (Array.isArray(result)) {
        const sanitizedResult = result.map((user) => {
          const { password, ...sanitizedUser } = user;
          return sanitizedUser;
        });

        return response.status(200).json(sanitizedResult);
      } else {
        return response.status(200).json(result);
      }
    } catch (error) {
      return response
        .status(500)
        .json({ message: 'Une erreur est survenue', error });
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    try {
      const result = await this.usersService.findOne(+id);
      delete result.password;
      return response.status(200).json(result);
    } catch (error) {
      return response
        .status(500)
        .json({ message: 'Une erreur est survenue', error });
    }
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}