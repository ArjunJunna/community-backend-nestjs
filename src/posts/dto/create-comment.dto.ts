import { IsNotEmpty, IsString } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;
  
  @IsString()
  authorId: string;
}