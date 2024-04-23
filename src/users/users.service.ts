import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
export const roundsOfHashing = 10;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: Prisma.UserCreateInput) {
    const hashedPassword = await bcrypt.hash(
      data.password,
      roundsOfHashing,
    );

    data.password = hashedPassword;
    return this.prisma.user.create({
      data,
    });
  }

  getUsers() {
    return this.prisma.user.findMany({
      include: {
        comment: true,
        createdForums: true,
        post: true,
        subscriptions: true,
        votes: true,
        commentVote: true,
      },
    });
  }

  getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
       include:{
        comment:true,
        createdForums:true,
        post:true,
        subscriptions:true,
        votes:true,
        commentVote:true
      }
    });
  }

  async deleteUserById(id: string) {
    const findUser = await this.getUserById(id);
    if (!findUser) throw new HttpException('User not found', 404);
    return this.prisma.user.delete({ where: { id } });
  }

  async updateUserById(id: string, data: Prisma.UserUpdateInput) {
    const findUser = await this.getUserById(id);
    if (!findUser) throw new HttpException('User Not Found', 404);

    if (data.username) {
      const findUser = await this.prisma.user.findUnique({
        where: { username: data.username as string },
      });
      if (findUser) throw new HttpException('Username already taken', 400);
    }
    return this.prisma.user.update({ where: { id }, data });
  }
}
