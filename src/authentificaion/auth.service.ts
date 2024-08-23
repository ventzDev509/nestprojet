import { LoginDto } from './dto/login-user-dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegistrationDto } from './dto/regisration-dto';
import { Users } from 'src/users/users.model';
import { usersService } from 'src/users/users.service';

// Service d'authentification
@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtservice: JwtService,
    private userservice: usersService,
  ) {}

  // Méthode de connexion
  async login(loginDto: LoginDto): Promise<any> {
    const { username, password } = loginDto;
    // Recherche de l'utilisateur par email
    const users = await this.prismaService.user.findUnique({
      where: { email: username },
    });
    if (!users) {
      throw new NotFoundException('utilisateur non trouvé');
    }

    // Vérification du mot de passe
    const validatePassword = await bcrypt.compare(password, users.password);
    if (!validatePassword) {
      throw new NotFoundException('mot de passe incorrect');
    }
    // Génération du token JWT
    return {
      token: this.jwtservice.sign({ username }),
    };
  }

  // Méthode d'inscription
  async register(createDto: RegistrationDto): Promise<any> {
    const createUser = new Users();
    createUser.name = createDto.name;
    createUser.email = createDto.email;
    createUser.role = createDto.role;
    // Hachage du mot de passe avant stockage
    createUser.password = await bcrypt.hash(createDto.password, 10);
    // Création de l'utilisateur
    const users = await this.userservice.create(createUser);
    // Génération du token JWT pour le nouvel utilisateur
    return {
      token: this.jwtservice.sign({ username: users.email }),
    };
  }
}