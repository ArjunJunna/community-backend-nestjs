import {  IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  authorId: string;

  @IsString()
  forumId: string;

  @IsString()
  @IsOptional()
  image:string
}
