import {
  Injectable,
  ConflictException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Users } from './users.model';

@Injectable()
export class usersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Users): Promise<Users> {
    try {
      return await this.prisma.user.create({ data });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (
          error.code === 'P2002' &&
          (error.meta?.target as string[])?.includes('email')
        ) {
          throw new ConflictException({
            message: "L'email existe déjà",
            statusCode: 409,
          });
        }
      }
      throw new Error("Erreur lors de la création de l'user");
    }
  }

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`user avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('user non trouvé');
    }
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
