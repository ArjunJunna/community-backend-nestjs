import { IsNotEmpty, IsString } from 'class-validator';

export class UnsubscribeFromForumDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
