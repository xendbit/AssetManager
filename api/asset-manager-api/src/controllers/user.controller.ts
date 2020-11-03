import { UserService } from './../services/user.service';
import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    @Get('new-address/:id')
    getNewAddress(@Param('id', ParseIntPipe) id: number) {
        return this.userService.getNewAddress(id);
    }
}