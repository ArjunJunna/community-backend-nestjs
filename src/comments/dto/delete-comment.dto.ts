import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteCommentDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
