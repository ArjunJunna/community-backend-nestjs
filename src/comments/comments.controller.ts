import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VoteType } from '@prisma/client';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Patch(':commentId')
  @UseGuards(JwtAuthGuard)
  updateCommentById(
    @Param('commentId') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.updateCommentById(id, updateCommentDto);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  deleteCommentById(@Param('commentId') id: string) {
    return this.commentsService.deleteCommentById(id);
  }

  @Post(':commentId/vote')
  @UseGuards(JwtAuthGuard)
  upvoteComment(@Param('commentId') id: string, @Body() castVoteDto: CastVoteDto) {
    return this.commentsService.upvoteComment(id, castVoteDto, VoteType.UP);
  }

  @Delete(':commentId/vote')
  @UseGuards(JwtAuthGuard)
  downvoteComment(@Param('commentId') id: string, @Body() castVoteDto: CastVoteDto) {
    return this.commentsService.downvoteComment(id, castVoteDto, VoteType.DOWN);
  
  }
}
