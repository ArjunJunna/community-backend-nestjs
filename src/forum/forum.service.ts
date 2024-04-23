import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateForumDto } from './dtos/CreateForum.dto';

@Injectable()
export class ForumService {
  constructor(private prisma: PrismaService) {}

  async createForum({ name, creatorId }: CreateForumDto) {
    const forumExists = await this.prisma.forum.findFirst({
      where: {
        name,
      },
    });

    if (forumExists) throw new HttpException('Forum already exists', 409);

    const newForum = await this.prisma.forum.create({
      data: {
        name,
        creatorId,
      },
    });

    await this.prisma.subscription.create({
      data: {
        userId: creatorId,
        forumId: newForum.id,
      },
    });

    return newForum;
  }

  async getForums() {
    const forums = await this.prisma.forum.findMany({
      include: {
        subscribers: true,
      },
    });

    const simplifiedForums = forums.map((forum) => {
      return {
        id: forum.id,
        name: forum.name,
        subscribersCount: forum.subscribers.length,
      };
    });

    return simplifiedForums;
  }

  getForumById(id: string) {
    return this.prisma.forum.findUnique({
      where: { id },
      include: {
        subscribers: true,
      },
    });
  }
  /*
  async deleteForumById(id: string) {
    const findForum = await this.getForumById(id);
    if (!findForum) throw new HttpException('Forum not found', 404);
    return this.prisma.forum.delete({ where: { id } });
  }*/
}
