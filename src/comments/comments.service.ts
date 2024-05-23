import { HttpException, Injectable } from '@nestjs/common';
import { VoteType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CastVoteDto } from './dto/cast-vote.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  updateCommentById(commentId: string, data: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data,
    });
  }

  deleteCommentById(commentId: string) {
    return this.prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
  }


  async upvoteComment(commentId: string, data: CastVoteDto, type: VoteType) {
    const { userId } = data;

    const existingVote = await this.prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingVote && existingVote.type == 'UP') {
      throw new HttpException('User has already upvoted this comment.', 409);
    } else {
      if (existingVote && existingVote.type == 'DOWN') {
        await this.prisma.commentVote.delete({
          where: {
            userId_commentId: {
              userId,
              commentId,
            },
          },
        });
      }
      await this.prisma.commentVote.create({
        data: {
          user: { connect: { id: userId } },
          comment: { connect: { id: commentId } },
          type,
        },
      });
    }

    const votes = await this.prisma.commentVote.findMany({
      where: {
        commentId,
      },
    });

    return votes;
  }

  async downvoteComment(commentId: string, data: CastVoteDto, type: VoteType) {
    const { userId } = data;

    const existingVote = await this.prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingVote) {
      await this.prisma.commentVote.delete({
        where: {
          userId_commentId: {
            userId,
            commentId,
          },
        },
      });
      await this.prisma.commentVote.create({
        data: {
          user: { connect: { id: userId } },
          comment: { connect: { id: commentId } },
          type,
        },
      });
    }

    const votes = await this.prisma.commentVote.findMany({
      where: {
        commentId,
      },
    });

    return votes;
  }
}