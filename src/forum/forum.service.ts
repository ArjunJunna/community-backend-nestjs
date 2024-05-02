import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateForumDto } from './dtos/CreateForum.dto';
import { UnsubscribeFromForumDto } from './dtos/DeleteSubscription.dto';
import { SubscribeToForumDto } from './dtos/CreateSubscription.dto';

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
        posts: {
          select: {
            title: true,
            id: true,
            content: true,
            image: true,
            createdAt: true,
            comments: {
              select: {
                text: true,
                author: {
                  select: {
                    username: true,
                    image: true,
                  },
                },
                createdAt: true,
              },
            },
            votes: {
              select: {
                type: true,
              },
            },
            author: {
              select: {
                username: true,
                image: true,
              },
            },
          },
        },
      },
    });

    const simplifiedForums = forums.map((forum) => {
      return {
        id: forum.id,
        name: forum.name,
        description:forum.description,
        image:forum.image,
        subscribersCount: forum.subscribers.length,
        posts:forum.posts,
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
  subscribeUserToForum(
    subscribeToForumDto: SubscribeToForumDto,
    forumId: string,
  ) {
    return this.prisma.subscription.create({
      data: {
        userId: subscribeToForumDto.userId,
        forumId,
      },
    });
  }

  unsubscribeUserFromForum(
    unsubscribeFromForumDto: UnsubscribeFromForumDto,
    forumId: string,
  ) {
    return this.prisma.subscription.deleteMany({
      where: {
        userId: unsubscribeFromForumDto.userId,
        forumId,
      },
    });
  }

 
  getAllSubscriptionsByForumId(forumId: string) {
    return this.prisma.subscription.findMany({
      where: {
        forumId,
      },
    });
  }
}
