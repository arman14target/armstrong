import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthedUser, JwtPayload } from "./jwt.strategy";

export interface AuthResult {
  token: string;
  user: AuthedUser;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    this.googleClient = clientId ? new OAuth2Client(clientId) : null;
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException("User already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email: normalizedEmail, passwordHash },
      select: { id: true, email: true },
    });

    return { token: this.signToken(user), user };
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid login credentials");
    }

    const safeUser: AuthedUser = { id: user.id, email: user.email };
    return { token: this.signToken(safeUser), user: safeUser };
  }

  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!this.googleClient || !clientId) {
      throw new UnauthorizedException("Google sign-in is not configured");
    }

    let payload: { email?: string; email_verified?: boolean };
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });
      payload = ticket.getPayload() ?? {};
    } catch {
      throw new UnauthorizedException("Invalid Google sign-in");
    }

    const email = payload.email?.trim().toLowerCase();
    if (!email || payload.email_verified === false) {
      throw new UnauthorizedException("Invalid Google sign-in");
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { email },
        select: { id: true, email: true },
      });
    }

    return { token: this.signToken(user), user };
  }

  private signToken(user: AuthedUser): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
