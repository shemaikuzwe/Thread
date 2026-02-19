import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import jwt from "jsonwebtoken";
import type { Request } from "express";

type AuthenticatedRequest = Request & { user?: unknown };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly openRoutes = new Set([
    "POST /v1/auth/signup",
    "POST /v1/auth/login",
    "GET /v1/auth/login",
    "GET /v1/auth/callback/google",
    "GET /v1/auth/session",
    "POST /v1/chats/events",
  ]);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (this.isOpenRoute(req)) {
      return true;
    }

    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException();
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new UnauthorizedException("AUTH_SECRET is not configured");
    }

    try {
      const payload = jwt.verify(token, secret);
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private isOpenRoute(req: Request) {
    const key = `${req.method} ${req.path}`;
    if (this.openRoutes.has(key)) {
      return true;
    }

    return (
      req.method === "GET" &&
      req.path.startsWith("/v1/chats/internal/users/") &&
      req.path.endsWith("/threads")
    );
  }

  private extractToken(req: Request) {
    const fromCookie = req.cookies?.auth_token;
    if (fromCookie) {
      return fromCookie;
    }
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }
    return authorization.substring(7);
  }
}
