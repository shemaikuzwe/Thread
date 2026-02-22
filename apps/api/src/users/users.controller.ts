import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Post("subscription")
  subscribe(@Session() session: UserSession, @Body() body: { sub: PushSubscription }) {
    const userId = session?.user?.id;
    return this.usersService.addSubscription(userId, body.sub);
  }

  @Post("subscription/test")
  testNotification() {
    return "Notification sent";
  }

  @Delete("subscription/:endpoint")
  unsubscribe(
    @Session() session: UserSession,
    @Param("endpoint") endpoint: string,
  ) {
    const userId = session?.user?.id;
    return this.usersService.removeSubscription(userId, endpoint);
  }
}
