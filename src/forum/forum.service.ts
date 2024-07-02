import {
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateForumDto } from './dtos/CreateForum.dto';
import { UnsubscribeFromForumDto } from './dtos/DeleteSubscription.dto';
import { SubscribeToForumDto } from './dtos/CreateSubscription.dto';
import { ToggleSubscriptionDto } from './dtos/ToggleSubscription.dto';
import { Cache } from 'cache-manager';
import { NotificationsGateway } from 'src/notification/notification-gateway';
import { toPascalCase } from 'src/utils';

@Injectable()
export class ForumService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  async createForum({ name, creatorId, description, image }: CreateForumDto) {
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
        description,
        image,
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
    try {
      const forumsData = await this.retrieveAllForums();
      return forumsData;
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving forums');
    }
  }

  async retrieveAllForums() {
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
        description: forum.description,
        image: forum.image,
        subscribersCount: forum.subscribers.length,
        posts: forum.posts,
      };
    });

    return simplifiedForums;
  }

  async findForumsByName(query: string) {
    try {
      const forumsSearch = await this.retrieveForumsOnSearch(query);
      return forumsSearch;
    } catch (error) {
      throw new InternalServerErrorException('Error retrieving forums');
    }
  }

  async retrieveForumsOnSearch(query: string) {
    return this.prisma.forum.findMany({
      where: {
        name: {
          startsWith: query,
        },
      },
      include: {
        _count: true,
      },
      take: 5,
    });
  }

  async getForumById(id: string) {
    const forumData = await this.prisma.forum.findUnique({
      where: { id },
      include: {
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
            forum: {
              select: {
                id: true,
                name: true,
                image: true,
                description: true,
                _count: true,
              },
            },
          },
        },
        subscribers: true,
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!forumData) {
      throw new NotFoundException(`Forum with id ${id} could not be found`);
    }

    return forumData;
  }
  /*
  async deleteForumById(id: string) {
    const findForum = await this.getForumById(id);
    if (!findForum) throw new HttpException('Forum not found', 404);
    return this.prisma.forum.delete({ where: { id } });
  }*/
  async subscribeUserToForum(
    subscribeToForumDto: SubscribeToForumDto,
    forumId: string,
  ) {
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        userId_forumId: {
          userId: subscribeToForumDto.userId,
          forumId: forumId,
        },
      },
    });

    if (existingSubscription) {
      throw new HttpException('User is already subscribed to this forum.', 409);
    }
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
    const deletedSubscription = this.prisma.subscription.delete({
      where: {
        userId_forumId: {
          userId: unsubscribeFromForumDto.userId,
          forumId: forumId,
        },
      },
    });
    return deletedSubscription;
  }

  getAllSubscriptionsByForumId(forumId: string) {
    return this.prisma.subscription.findMany({
      where: {
        forumId,
      },
    });
  }

  async toggleSubscription(
    toggleSubscriptionDto: ToggleSubscriptionDto,
    forumId: string,
  ) {
    
    const { userId } = toggleSubscriptionDto;
    const subscriber = await this.prisma.user.findUnique({
      where: { id:userId },
      select: {
        username: true,
      },
    });
    const existingSubscription = await this.prisma.subscription.findUnique({
      where: {
        userId_forumId: {
          userId,
          forumId,
        },
      },
    });

    if (existingSubscription) {
      await this.prisma.subscription.delete({
        where: {
          userId_forumId: {
            userId,
            forumId,
          },
        },
      });
      return { message: 'Unsubscribed' };
    } else {
       const subscription = await this.prisma.subscription.create({
         data: {
           userId,
           forumId,
         },
       });

       const forum = await this.prisma.forum.findUnique({
         where: { id: forumId },
         select: { creatorId: true, name: true },
       });

       if (forum?.creatorId) {
         this.notificationsGateway.sendNotificationToUser(forum.creatorId, {
           message: `${toPascalCase(subscriber?.username)} subscribed to your forum ${forum?.name}`,
           forumId: forumId,
         });
       }

      return { message: 'Subscribed',subscription };
    }
  }
}
