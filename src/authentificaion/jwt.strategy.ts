import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiraion: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }
  async validate(payload: { username: string }) {
    const users = await this.prismaService.user.findUnique({
      where: {
        email: payload.username,
      },
    });
    return users;
  }
}
