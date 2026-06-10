import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { NewAddress } from '@spinzo/db';

@Controller('users/me/addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  async create(@Req() req: any, @Body() data: Omit<NewAddress, 'userId'>) {
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required' };
    return this.addressesService.create(userId, data);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required' };
    return this.addressesService.findAllByUserId(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required' };
    return this.addressesService.findOne(userId, id);
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: Partial<NewAddress>) {
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required' };
    return this.addressesService.update(userId, id, data);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.headers['x-user-id'];
    if (!userId) return { message: 'x-user-id header required' };
    await this.addressesService.remove(userId, id);
    return { message: 'Address deleted' };
  }
}
