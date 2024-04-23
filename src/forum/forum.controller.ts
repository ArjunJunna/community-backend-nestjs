import {
  Body,
  Controller,
  Get,
  HttpException,
  Param,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ForumService } from './forum.service';
import { CreateForumDto } from './dtos/CreateForum.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('forums')
export class ForumController {
  constructor(private forumService: ForumService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UsePipes(ValidationPipe)
  createForum(@Body() createForumDto: CreateForumDto) {
    return this.forumService.createForum(createForumDto);
  }

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
}
