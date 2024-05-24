import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ForumModule } from './forum/forum.module';
import { CommentsModule } from './comments/comments.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 30 * 1000,
    }),
    UsersModule,
    PostsModule,
    AuthModule,
    ForumModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
