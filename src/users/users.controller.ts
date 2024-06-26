import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Patch,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dtos/CreateUser.dto';
import { UpdateUserDto } from './dtos/UpdateUser.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UsePipes(ValidationPipe)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.getUserById(id);
    if (!user) throw new HttpException('User Not Found', 404);
    return user;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateUserById(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateUserById(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteUserById(id);
  }

  @Get(':id/subscribe')
  @UseGuards(JwtAuthGuard)
  getUserSubscriptionsById(@Param('id') id: string) {
    return this.usersService.getAllSubscriptionsByUserId(id);
   
  }
}
