import { HttpException, Inject, Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Cache } from 'cache-manager';
import { NotificationsGateway } from 'src/notification/notification-gateway';
import { toPascalCase } from 'src/utils';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    @Inject('CACHE_MANAGER') private cacheManager: Cache,
  ) {}

  async getAllPosts() {
    const postsData = await this.retrieveAllPosts();
    return postsData;
  }
  async retrieveAllPosts() {
    return this.prisma.post.findMany({
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
            userId: true,
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
    });
  }

  createPost(data: Prisma.PostCreateManyInput) {
    return this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        forumId: data.forumId,
        image: data.image,
      },
    });
  }

  getPostById(id: string) {
    return this.prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        title: true,
        id: true,
        content: true,
        image: true,
        createdAt: true,
        comments: {
          where: {
            postId: id,
            replyToId: null,
          },
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                image: true,
              },
            },
            votes: true,
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    username: true,
                    email: true,
                    image: true,
                  },
                },
                votes: true,
              },
            },
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
    });
  }

  async getAllCustomPosts(id: string) {
    const subscribedForums = await this.prisma.subscription.findMany({
      where: {
        userId: id,
      },
      include: {
        forum: true,
      },
    });
    const customPosts = await this.prisma.post.findMany({
      where: {
        forum: {
          name: {
            in: subscribedForums.map((sub) => sub.forum.name),
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
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
    });
    return customPosts;
  }

  async deletePostById(id: string) {
    const findPost = await this.getPostById(id);
    if (!findPost) throw new HttpException('Post not found', 404);
    return this.prisma.post.delete({ where: { id } });
  }

  async updatePostById(id: string, data: UpdatePostDto) {
    const findPost = await this.getPostById(id);
    if (!findPost) throw new HttpException('Post Not Found', 404);
    return this.prisma.post.update({ where: { id }, data });
  }

  async getAllVotesByPostId(postId: string) {
    const findPost = await this.getPostById(postId);
    if (!findPost) throw new HttpException('Post Not Found', 404);
    return this.prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        votes: true,
      },
    });
  }

  async upvotePost(postId: string, data: CastVoteDto, type: VoteType) {
    const { userId } = data;
    const notifyPostAuthor=async(userId:string)=>{
       const user = await this.prisma.user.findUnique({
         where: { id: userId },
         select: {
           username: true,
         },
       });
       this.notificationsGateway.sendNotificationToUser(postDetails.authorId, {
         message: `${toPascalCase(user?.username)} just upvoted your post.`,
         postId: postId,
       });
    }
    const postDetails = await this.prisma.post.findUnique({
      where:{
        id: postId,
      }
    })
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === 'UP') {
        await this.prisma.vote.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
      } else if (existingVote.type === 'DOWN') {
        const response = await this.prisma.vote.update({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          data: {
            type,
          },
        });
        if (response) {
          await notifyPostAuthor(userId);
        }
      }
    } else {
      const response = await this.prisma.vote.create({
        data: {
          user: { connect: { id: userId } },
          post: { connect: { id: postId } },
          type,
        },
      });
       if (response) {
          await notifyPostAuthor(userId);
       }
    }

    const votes = await this.prisma.vote.findMany({
      where: {
        postId,
      },
    });

    return votes;
  }

  async downvotePost(postId: string, data: CastVoteDto, type: VoteType) {
    const { userId } = data;

    const existingVote = await this.prisma.vote.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === 'DOWN') {
        await this.prisma.vote.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        });
      } else if (existingVote.type === 'UP') {
        await this.prisma.vote.update({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
          data: {
            type,
          },
        });
      }
    } else {
      await this.prisma.vote.create({
        data: {
          user: { connect: { id: userId } },
          post: { connect: { id: postId } },
          type,
        },
      });
    }

    const votes = await this.prisma.vote.findMany({
      where: {
        postId,
      },
    });

    return votes;
  }

  async createCommentToPost(postId: string, data: CreateCommentDto) {
    console.log('post comment data', data, postId);
    const {authorId}=data;
    const postDetails = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });
    const createdComment = this.prisma.comment.create({
      data: {
        postId,
        authorId: data.authorId,
        text: data.text,
        replyToId: data.replyToId || null,
      },
    });
    if (createdComment) {
      const user = await this.prisma.user.findUnique({
        where: { id: authorId },
        select: {
          username: true,
        },
      });
      this.notificationsGateway.sendNotificationToUser(postDetails.authorId, {
        message: `${toPascalCase(user?.username)} just added a comment on your post.`,
        postId: postId,
      });
    }
  }

  getAllCommentsOnPostById(postId: string) {
    return this.prisma.comment.findMany({
      where: {
        postId,
        replyToId: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
            image: true,
          },
        },
        votes: true,
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                email: true,
                image: true,
              },
            },
            votes: true,
          },
        },
      },
    });
  }
}
