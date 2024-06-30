import { HttpException, Injectable } from '@nestjs/common';
import { VoteType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { DeleteCommentDto } from './dto/delete-comment.dto';
import { NotificationsGateway } from 'src/notification/notification-gateway';
import { toPascalCase } from 'src/utils';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  updateCommentById(commentId: string, data: UpdateCommentDto) {
    return this.prisma.comment.update({
      where: {
        id: commentId,
      },
      data,
    });
  }

  async deleteCommentById(commentId: string,{userId}:DeleteCommentDto) {
     const comment = await this.prisma.comment.findUnique({
       where: {
         id: commentId,
       },
       select: {
         authorId: true,
       },
     });

     if (!comment) {
        throw new HttpException('Comment not found.', 404);
     }

     if (comment.authorId !== userId) {
        throw new HttpException('User not authorized to delete this comment.', 401);
     }

     return await this.prisma.comment.delete({
       where: {
         id: commentId,
       },
     });
  }


  async upvoteComment(commentId: string, data: CastVoteDto, type: VoteType) {
    const { userId } = data;
    const notifyCommentAuthor = async (userId: string) => {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
        },
      });
      this.notificationsGateway.sendNotificationToUser(commentDetails.authorId, {
        message: `${toPascalCase(user?.username)} just upvoted your comment.`,
        commentId,
      });
    };
     const commentDetails = await this.prisma.comment.findUnique({
       where: {
         id: commentId,
       },
     });

    const existingVote = await this.prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId,
        },
      },
    });

    if (existingVote){
       if (existingVote.type === 'UP') {
         await this.prisma.commentVote.delete({
           where: {
             userId_commentId: {
               userId,
               commentId,
             },
           },
         });
       } else if (existingVote.type === 'DOWN') {
           const response = await this.prisma.commentVote.update({
             where: {
               userId_commentId: {
                 userId,
                 commentId,
               },
             },
             data: {
               type,
             },
           });
           if (response) {
             await notifyCommentAuthor(userId);
           }
       }}else {
      const response = await this.prisma.commentVote.create({
        data: {
          user: { connect: { id: userId } },
          comment: { connect: { id: commentId } },
          type,
        },
      });
       if (response) {
             await notifyCommentAuthor(userId);
           }
    }
    const votes = await this.prisma.commentVote.findMany({
      where: {
        commentId
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
        if (existingVote.type === 'DOWN') {
          await this.prisma.commentVote.delete({
            where: {
              userId_commentId: {
                userId,
                commentId,
              },
            },
          });
        } else if (existingVote.type === 'UP') {
          await this.prisma.commentVote.update({
            where: {
              userId_commentId: {
                userId,
                commentId,
              },
            },
            data: {
              type,
            },
          });
        }
      } else {
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