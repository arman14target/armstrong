import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthedUser, JwtPayload } from "./jwt.strategy";
import {
  verifyAppleToken,
  verifyGoogleToken,
  type SocialIdentity,
} from "./social-verify";

export interface AuthResult {
  token: string;
  user: AuthedUser;
}

type SocialProvider = "google" | "apple";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

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

    // No local password ⇒ SSO-only account; reject password sign-in.
    if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid login credentials");
    }

    if (user.disabled) {
      throw new ForbiddenException("This account has been disabled");
    }

    const safeUser: AuthedUser = { id: user.id, email: user.email };
    return { token: this.signToken(safeUser), user: safeUser };
  }

  async signInWithGoogle(idToken: string): Promise<AuthResult> {
    return this.signInWithSocial("google", await verifyGoogleToken(idToken));
  }

  async signInWithApple(identityToken: string): Promise<AuthResult> {
    return this.signInWithSocial("apple", await verifyAppleToken(identityToken));
  }

  private async signInWithSocial(
    provider: SocialProvider,
    identity: SocialIdentity,
  ): Promise<AuthResult> {
    const subField = provider === "google" ? "googleSub" : "appleSub";

    // 1) Returning user — matched by the stable provider subject id.
    let user = await this.prisma.user.findFirst({
      where: { [subField]: identity.sub },
      select: { id: true, email: true, disabled: true },
    });

    // 2) Existing account with the same verified email — link this provider.
    if (!user && identity.email && identity.emailVerified) {
      const byEmail = await this.prisma.user.findUnique({
        where: { email: identity.email },
        select: { id: true, email: true, disabled: true },
      });
      if (byEmail) {
        user = await this.prisma.user.update({
          where: { id: byEmail.id },
          data: { [subField]: identity.sub },
          select: { id: true, email: true, disabled: true },
        });
      }
    }

    // 3) Brand-new account.
    if (!user) {
      if (!identity.email) {
        // Apple only returns the email on first authorization; without a prior
        // account we have nothing to key on.
        throw new UnauthorizedException(
          "Could not complete sign-in (no email from provider).",
        );
      }
      user = await this.prisma.user.create({
        data: { email: identity.email, [subField]: identity.sub },
        select: { id: true, email: true, disabled: true },
      });
    }

    if (user.disabled) {
      throw new ForbiddenException("This account has been disabled");
    }

    const safeUser: AuthedUser = { id: user.id, email: user.email };
    return { token: this.signToken(safeUser), user: safeUser };
  }

  private signToken(user: AuthedUser): string {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return this.jwt.sign(payload);
  }
}
