import { IsNotEmpty, IsString } from 'class-validator';

export class ToggleSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
