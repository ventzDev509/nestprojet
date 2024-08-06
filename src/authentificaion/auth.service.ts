import { LoginDto } from './dto/login-user-dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegistrationDto } from './dto/regisration-dto';
import { Users } from 'src/users/users.model';
import { usersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private jwtservice: JwtService,
    private userservice: usersService,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    const { username, password } = loginDto;
    const users = await this.prismaService.user.findUnique({
      where: { email: username },
    });
    if (!users) {
      throw new NotFoundException('user not found');
    }

    const validatePassword = await bcrypt.compare(password, users.password);
    if (!validatePassword) {
      throw new NotFoundException('password incorrect');
    }
    return {
      token: this.jwtservice.sign({ username }),
    };
  }

  async register(createDto: RegistrationDto): Promise<any> {
    const createUser = new Users();
    createUser.name = createDto.name;
    createUser.email = createDto.email;
    createUser.role = createDto.role;
    createUser.password = await bcrypt.hash(createDto.password, 10);
    const users = await this.userservice.create(createUser);
    return {
      token: this.jwtservice.sign({ username: users.email }),
    };
  }
}
