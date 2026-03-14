import { Injectable, UnauthorizedException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { db } from "@thread/db";
import { users } from "@thread/db/schema";
import { eq } from "drizzle-orm";
import { RegisterDto, LoginDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (existing.length > 0) throw new ConflictException("Email already exists");

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
      })
      .returning();

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const [user] = await db.select().from(users).where(eq(users.email, dto.email)).limit(1);
    if (!user?.password) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    return this.generateTokens(user);
  }

  async validateUser(userId: string) {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return user;
  }

  async googleLogin(profile: { email: string; firstName: string; lastName: string; picture: string }) {
    let [user] = await db.select().from(users).where(eq(users.email, profile.email)).limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.picture,
        })
        .returning();
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: typeof users.$inferSelect) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwt.sign(payload);
    return { accessToken, user: this.sanitizeUser(user) };
  }

  private sanitizeUser(user: typeof users.$inferSelect) {
    const { password, ...rest } = user;
    return rest;
  }
}
