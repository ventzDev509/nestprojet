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

  // Méthode pour créer un nouvel utilisateur
  async create(data: Users): Promise<Users> {
    try {
      // Tentative de création de l'utilisateur dans la base de données
      return await this.prisma.user.create({ data });
    } catch (error) {
      // Gestion des erreurs spécifiques à Prisma
      if (error instanceof PrismaClientKnownRequestError) {
        // Vérification si l'erreur est due à un email déjà existant
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
      // Si l'erreur n'est pas spécifique, on lance une erreur générique
      throw new Error("Erreur lors de la création de l'user");
    }
  }

  // Méthode pour récupérer tous les utilisateurs
  async findAll() {
    return this.prisma.user.findMany();
  }

  // Méthode pour trouver un utilisateur par son ID
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    // Si l'utilisateur n'est pas trouvé, on lance une exception
    if (!user) {
      throw new NotFoundException(`user avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  // Méthode pour trouver un utilisateur par son email
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Méthode pour supprimer un utilisateur
  async remove(id: number) {
    // On vérifie d'abord si l'utilisateur existe
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('user non trouvé');
    }
    // Si l'utilisateur existe, on le supprime
    return this.prisma.user.delete({
      where: { id },
    });
  }
}