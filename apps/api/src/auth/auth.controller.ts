import { Controller, Post, Get, Body, Req, Res, UseGuards, Param, Query } from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Public } from "../common/decorators/public.decorator";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("signup")
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(dto);
    this.setCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @UseGuards(AuthGuard("local"))
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setCookie(res, result.accessToken);
    return result;
  }

  @Public()
  @Get("google")
  @UseGuards(AuthGuard("google"))
  googleAuth() {}

  @Public()
  @Get("callback/google")
  @UseGuards(AuthGuard("google"))
  async googleCallback(@Req() req: any, @Res() res: Response) {
    const result = req.user;
    this.setCookie(res, result.accessToken);
    res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
  }

  @Get("session")
  async session(@Req() req: any) {
    return { user: req.user };
  }

  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken");
    return { message: "Logged out" };
  }

  private setCookie(res: Response, token: string) {
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
}
