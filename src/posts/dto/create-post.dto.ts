import {  IsOptional, IsString ,IsJSON} from 'class-validator';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsJSON()
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
