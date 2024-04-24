import { HttpException, Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePostDto } from './dto/update-post.dto';
import { CastVoteDto } from './dto/cast-vote.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  createPost(data: Prisma.PostCreateManyInput) {
    return this.prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        authorId: data.authorId,
        forumId: data.forumId,
      },
    });
  }

  getPostById(id: string) {
    return this.prisma.post.findUnique({
      where: {
        id,
      },
      include: {
        votes: true,
        comments: true,
      },
    });
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

  async upvotePost(postId: string, data: CastVoteDto, type: VoteType) {
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
      throw new HttpException('User has already upvoted this post.', 409);
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
      await this.prisma.vote.delete({
        where: {
          userId_postId: {
            userId,
            postId,
            
          },
        },
      });
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
}
