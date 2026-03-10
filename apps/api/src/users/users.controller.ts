import { Body, Controller, Delete, Get, HttpCode, Param, Post } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import webpush from "web-push";

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
  @HttpCode(200)
  subscribe(@Session() session: UserSession, @Body() body: { sub: webpush.PushSubscription }) {
    const userId = session?.user?.id;
    return this.usersService.addSubscription(userId, body.sub);
  }

  @Post("subscription/test")
  @HttpCode(200)
  async testNotification(@Session() session: UserSession) {
    const userId = session.user.id;
    await this.usersService.sendNotification("Test notification", "Test message", userId);
    return "notification sent";
  }

  @Delete("subscription/:endpoint")
  unsubscribe(@Session() session: UserSession, @Param("endpoint") endpoint: string) {
    const userId = session?.user?.id;
    return this.usersService.removeSubscription(userId, endpoint);
  }
}
