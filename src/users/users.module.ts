import { Module } from '@nestjs/common';
import { usersService } from './users.service';
import { usersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  controllers: [usersController],
  providers: [usersService, PrismaService],
  exports: [usersService], // Assure-toi que usersService est exporté
})
export class usersModule {}
