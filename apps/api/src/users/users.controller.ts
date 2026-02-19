import { Body, Controller, Delete, Get, Param, Post, Request } from "@nestjs/common";
import { UsersService } from "./users.service.js";

type AuthRequest = { user: { id: string } };

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Post("subscription")
  subscribe(@Request() req: AuthRequest, @Body() body: { sub: unknown }) {
    const userId = req.user.id;
    return this.usersService.addSubscription(userId, body.sub);
  }

  @Post("subscription/test")
  testNotification() {
    return "Notification sent";
  }

  @Delete("subscription/:endpoint")
  unsubscribe(@Request() req: AuthRequest, @Param("endpoint") endpoint: string) {
    const userId = req.user.id;
    return this.usersService.removeSubscription(userId, endpoint);
  }
}
