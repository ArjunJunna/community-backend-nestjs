import { IsNotEmpty, IsString } from 'class-validator';

export class SubscribeToForumDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
