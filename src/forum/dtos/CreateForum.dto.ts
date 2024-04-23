import { IsNotEmpty, IsString } from "class-validator";


export class CreateForumDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  creatorId: string;
}