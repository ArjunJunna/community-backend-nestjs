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

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UsePipes(ValidationPipe)
  createPost(@Body() createPostDto: CreatePostDto) {
    return this.postsService.createPost(createPostDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    const post = await this.postsService.getPostById(id);
    if (!post) throw new HttpException('Post Not Found', 404);
    return post;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateUserById(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postsService.updatePostById(id, updatePostDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteUserById(@Param('id') id: string) {
    return this.postsService.deletePostById(id);
  }

  @Post(':id/upvote')
  @UseGuards(JwtAuthGuard)
  async upvotePost(@Param('id') id: string, @Body() castVoteDto: CastVoteDto) {
    return await this.postsService.upvotePost(id, castVoteDto, VoteType.UP);
  }

  @Delete(':id/downvote')
  @UseGuards(JwtAuthGuard)
  async downvotePost(
    @Param('id') id: string,
    @Body() castVoteDto: CastVoteDto,
  ) {
    return await this.postsService.downvotePost(id, castVoteDto, VoteType.DOWN);
  }
}
