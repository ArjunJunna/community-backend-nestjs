import { IsEnum, IsString } from 'class-validator';

enum VoteType {
  UP,
  DOWN
}

export class CastVoteDto {
  @IsString()
  userId: string;

  @IsEnum(VoteType)
  type: VoteType;
}
