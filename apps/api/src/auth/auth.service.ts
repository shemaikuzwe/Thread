import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db, users } from "@thread/db";
import { eq } from "drizzle-orm";
import type { LoginDto, RegisterDto } from "./auth.dto.js";

@Injectable()
export class AuthService {
  async signup(dto: RegisterDto) {
    const exists = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (exists.length) {
      throw new ConflictException("Email already exists");
    }

    const password = await bcrypt.hash(dto.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        email: dto.email,
        firstName: dto.first_name,
        lastName: dto.last_name,
        password,
      })
      .returning();

    const token = this.sign(user);
    return { token, user: this.sanitize(user) };
  }

  async login(dto: LoginDto) {
    const [user] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (!user?.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const token = this.sign(user);
    return { token, user: this.sanitize(user) };
  }

  private sign(user: typeof users.$inferSelect) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new UnauthorizedException("AUTH_SECRET is not configured");
    }
    return jwt.sign(
      {
        sub: user.id,
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        profile_picture: user.profilePicture,
      },
      secret,
      { expiresIn: "24h" },
    );
  }

  private sanitize(user: typeof users.$inferSelect) {
    const { password, ...rest } = user;
    return rest;
  }
}
