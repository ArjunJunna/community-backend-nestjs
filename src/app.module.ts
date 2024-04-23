import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ForumModule } from './forum/forum.module';


@Module({
  imports: [UsersModule, PostsModule, AuthModule, ForumModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
