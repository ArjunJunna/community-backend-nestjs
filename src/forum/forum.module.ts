import { Module } from '@nestjs/common';
import { ForumService } from './forum.service';
import { ForumController } from './forum.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports:[PrismaModule,NotificationModule],
  providers: [ForumService],
  controllers: [ForumController]
})
export class ForumModule {}
