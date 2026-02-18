import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import jwt from "jsonwebtoken";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
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

  private extractToken(req: { cookies?: Record<string, string>; headers: Record<string, string> }) {
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
