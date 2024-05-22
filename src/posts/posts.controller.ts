import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UsePipes,
  ValidationPipe,
  HttpException,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { UpdatePostDto } from './dto/update-post.dto';
import { CastVoteDto } from './dto/cast-vote.dto';
import { VoteType } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  getAllPosts() {
    return this.postsService.getAllPosts();
  }

  @Post()
  @UsePipes(ValidationPipe)
  createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(createPostDto);
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    const post = await this.postsService.getPostById(id);
    if (!post) throw new HttpException('Post Not Found', 404);
    return post;
  }

  @Get('/custom/:id')
  @UseGuards(JwtAuthGuard)
  async getAllCustomPosts(@Param('id') id: string) {
    return this.postsService.getAllCustomPosts(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updatePostById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePostById(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePostById(@Param('id') id: string) {
    return this.postsService.deletePostById(id);
  }

  @Post(':id/upvote')
  @UseGuards(JwtAuthGuard)
  upvotePost(@Param('id') id: string, @Body() castVoteDto: CastVoteDto) {
    return this.postsService.upvotePost(id, castVoteDto, VoteType.UP);
  }

  @Delete(':id/downvote')
  @UseGuards(JwtAuthGuard)
  downvotePost(@Param('id') id: string, @Body() castVoteDto: CastVoteDto) {
    return this.postsService.downvotePost(id, castVoteDto, VoteType.DOWN);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  getAllCommentsOfPost(@Param('id') id: string) {
    return this.postsService.getAllCommentsOnPostById(id)
  }

  @Post(':id/comment')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.postsService.createCommentToPost(id, createCommentDto);
  }

}
