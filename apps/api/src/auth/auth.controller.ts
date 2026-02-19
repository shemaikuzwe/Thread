import { Body, Controller, Get, Post, Query, Req, Res } from "@nestjs/common";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { AuthService } from "./auth.service.js";
import { LoginDto, RegisterDto } from "./auth.dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup(dto);
    this.setCookie(res, result.token);
    return { message: "user registered", user: result.user };
  }

  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(dto);
    this.setCookie(res, result.token);
    return { message: "user logged in", user: result.user };
  }

  @Get("login")
  oauthLogin(@Query("oauth") oauth?: string) {
    if (oauth === "google") {
      return {
        message: "Google OAuth migration is pending in Nest API. Use credential login for now.",
      };
    }
    return { message: "Unsupported oauth provider" };
  }

  @Get("callback/google")
  callback(@Res() res: Response) {
    return res.redirect(process.env.CLIENT_APP_URL || "http://localhost:5173");
  }

  @Get("session")
  session(@Req() req: { cookies?: Record<string, string> }) {
    const token = req.cookies?.auth_token;
    if (!token) {
      return { status: "un_authenticated", user: "" };
    }

    try {
      const payload = jwt.verify(token, process.env.AUTH_SECRET || "");
      return { status: "authenticated", user: payload };
    } catch {
      return { status: "un_authenticated", user: "" };
    }
  }

  @Get("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    res.cookie("auth_token", "", { maxAge: -1, httpOnly: true, sameSite: "lax" });
    return "Logout successfully";
  }

  private setCookie(res: Response, token: string) {
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
  }
}
