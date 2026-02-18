import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";
import { UsersService } from "./users.service.js";

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
  subscribe(@CurrentUser("id") userId: string, @Body() body: { sub: unknown }) {
    return this.usersService.addSubscription(userId, body.sub);
  }

  @Post("subscription/test")
  testNotification() {
    return "Notification sent";
  }

  @Delete("subscription/:endpoint")
  unsubscribe(@CurrentUser("id") userId: string, @Param("endpoint") endpoint: string) {
    return this.usersService.removeSubscription(userId, endpoint);
  }
}
