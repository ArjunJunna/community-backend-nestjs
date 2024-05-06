import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
export const roundsOfHashing = 10;

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}
  
  async createUser(data: Prisma.UserCreateInput) {
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ username: data.username }, { email: data.email }],
        },
      });

      if (existingUser) {
        let field;
        if (existingUser.username === data.username) {
          field = 'username';
        } else {
          field = 'email';
        }
        return { status: 409, message: `The ${field} is already taken.` };
      }
      const hashedPassword = await bcrypt.hash(data.password, roundsOfHashing);
      data.password = hashedPassword;
      const newUser = await this.prisma.user.create({ data });

      const userDetails = await this.prisma.user.findUnique({
        where: {
          username: newUser.username,
        },
      });
      const { password, ...user } = userDetails;
      const token = this.jwtService.sign(user);
      return { ...user, token };
    } catch (error) {
      console.log(error)
    }
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

  async getAllSubscriptionsByUserId(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        userId,
      },
    });
    if (subscriptions.length == 0)
      throw new HttpException('User has no subscriptions', 400);
    const subscriptionsWithForumDetails = await Promise.all(
      subscriptions.map(async (subscription) => {
        const forum = await this.prisma.forum.findUnique({
          where: {
            id: subscription.forumId,
          },
        });
        return forum;
      }),
    );

    return subscriptionsWithForumDetails;
  }
}
