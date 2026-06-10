import { Controller, Get, Post, Put, Body, Param, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { NewUser } from '@spinzo/db';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@Req() req: any) {
    // TODO: Extract userId from JWT via guard. For now, use header.
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required (will be from JWT in production)' };
    return this.usersService.findById(userId);
  }

  @Put('me')
  async updateMyProfile(@Req() req: any, @Body() updateData: Partial<NewUser>) {
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required' };
    return this.usersService.update(userId, updateData);
  }

  @Post()
  async create(@Body() createUserDto: NewUser) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Get('firebase/:firebaseUid')
  async findByFirebaseUid(@Param('firebaseUid') firebaseUid: string) {
    return this.usersService.findByFirebaseUid(firebaseUid);
  }
}
