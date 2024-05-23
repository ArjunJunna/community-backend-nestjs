import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  authorId: string;

  @IsString()
  @IsOptional()
  replyToId: string;
}