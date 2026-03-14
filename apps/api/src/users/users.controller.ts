import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get("me")
  getCurrentUser(@CurrentUser("id") userId: string) {
    return this.usersService.findById(userId);
  }

  @Get(":id")
  findById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Post("subscription")
  async addSubscription(
    @CurrentUser("id") userId: string,
    @Body() body: { sub: Record<string, unknown>; endpoint: string },
  ) {
    return this.usersService.addSubscription(userId, body.sub, body.endpoint);
  }

  @Delete("subscription/:endpoint")
  async removeSubscription(@Param("endpoint") endpoint: string) {
    await this.usersService.removeSubscription(decodeURIComponent(endpoint));
    return { message: "Subscription removed" };
  }
}
