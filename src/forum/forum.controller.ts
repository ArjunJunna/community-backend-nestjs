import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreateForumDto } from './dtos/CreateForum.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { SubscribeToForumDto } from './dtos/CreateSubscription.dto';
import { UnsubscribeFromForumDto } from './dtos/DeleteSubscription.dto';
import { ToggleSubscriptionDto } from './dtos/ToggleSubscription.dto';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@UseInterceptors(CacheInterceptor)
@Controller('forums')
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  createForum(@Body() createForumDto: CreateForumDto) {
    return this.forumService.createForum(createForumDto);
  }

  @CacheTTL(60 * 1000)
  @Get()
  getForums() {
    return this.forumService.getForums();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getForumById(@Param('id') id: string) {
    const forum = await this.forumService.getForumById(id);
    if (!forum) throw new HttpException('Forum Not Found', 404);
    return forum;
  }
  /*
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteForumById(@Param('id') id: string) {
  return this.forumService.deleteForumById(id); 
  }
  */

  @Post(':forumId/subscription')
  @UseGuards(JwtAuthGuard)
  async toggleSubscription(
    @Body() toggleSubscriptionDto: ToggleSubscriptionDto,
    @Param('forumId') forumId: string,
  ) {
    return this.forumService.toggleSubscription(toggleSubscriptionDto, forumId);
  }

  @Post(':forumId/subscribe')
  @UseGuards(JwtAuthGuard)
  async subscribeToForum(
    @Body() subscribeToForumDto: SubscribeToForumDto,
    @Param('forumId') forumId: string,
  ) {
    return this.forumService.subscribeUserToForum(subscribeToForumDto, forumId);
  }

  @Delete(':forumId/unsubscribe')
  @UseGuards(JwtAuthGuard)
  async unsubscribeFromForum(
    @Body() unsubscribeFromForumDto: UnsubscribeFromForumDto,
    @Param('forumId') forumId: string,
  ) {
    return this.forumService.unsubscribeUserFromForum(
      unsubscribeFromForumDto,
      forumId,
    );
  }
}
