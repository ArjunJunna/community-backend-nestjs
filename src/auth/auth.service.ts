import { Injectable } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}


  async validateUser({ username, password }: AuthPayloadDto) {
    const findUser = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!findUser) return null;
    const isPasswordValid = await bcrypt.compare(password, findUser.password);
    if (isPasswordValid) {
      const { password, ...user } = findUser;
      return this.jwtService.sign(user);
    }
  }
}
