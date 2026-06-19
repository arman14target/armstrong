import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";
import * as social from "./social-verify";

jest.mock("./social-verify");
const mockedSocial = social as jest.Mocked<typeof social>;

function makeService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  const jwt = { sign: jest.fn().mockReturnValue("signed-token") };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new AuthService(prisma as any, jwt as any);
  return { service, prisma, jwt };
}

describe("AuthService.signUp", () => {
  it("hashes the password, creates the user, and returns a token", async () => {
    const { service, prisma, jwt } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: "u1", email: "a@b.com" });

    const result = await service.signUp("A@B.com", "secret1");

    expect(result).toEqual({
      token: "signed-token",
      user: { id: "u1", email: "a@b.com" },
    });
    const createArg = prisma.user.create.mock.calls[0][0];
    expect(createArg.data.email).toBe("a@b.com"); // normalized lowercase
    expect(createArg.data.passwordHash).not.toBe("secret1"); // hashed
    expect(await bcrypt.compare("secret1", createArg.data.passwordHash)).toBe(
      true,
    );
    expect(jwt.sign).toHaveBeenCalled();
  });

  it("rejects a duplicate email", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });

    await expect(service.signUp("a@b.com", "secret1")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("AuthService.signIn", () => {
  it("returns a token for valid credentials", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      passwordHash: await bcrypt.hash("secret1", 4),
    });

    const result = await service.signIn("a@b.com", "secret1");
    expect(result.token).toBe("signed-token");
    expect(result.user).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("rejects a wrong password", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      passwordHash: await bcrypt.hash("secret1", 4),
    });

    await expect(service.signIn("a@b.com", "wrong")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects an unknown user", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.signIn("nobody@b.com", "secret1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an SSO-only account (no password hash) on password sign-in", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      passwordHash: null,
    });

    await expect(service.signIn("a@b.com", "secret1")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});

describe("AuthService.signInWithGoogle (linking)", () => {
  it("returns the existing user matched by provider sub", async () => {
    const { service, prisma } = makeService();
    mockedSocial.verifyGoogleToken.mockResolvedValue({
      sub: "g-123",
      email: "a@b.com",
      emailVerified: true,
    });
    prisma.user.findFirst.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      disabled: false,
    });

    const result = await service.signInWithGoogle("tok");
    expect(result.user).toEqual({ id: "u1", email: "a@b.com" });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("links the provider to an existing verified-email account", async () => {
    const { service, prisma } = makeService();
    mockedSocial.verifyGoogleToken.mockResolvedValue({
      sub: "g-123",
      email: "a@b.com",
      emailVerified: true,
    });
    prisma.user.findFirst.mockResolvedValue(null); // no sub match
    prisma.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      disabled: false,
    });
    prisma.user.update.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      disabled: false,
    });

    await service.signInWithGoogle("tok");
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { googleSub: "g-123" } }),
    );
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("creates a new account when nothing matches", async () => {
    const { service, prisma } = makeService();
    mockedSocial.verifyGoogleToken.mockResolvedValue({
      sub: "g-999",
      email: "new@b.com",
      emailVerified: true,
    });
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "u2",
      email: "new@b.com",
      disabled: false,
    });

    const result = await service.signInWithGoogle("tok");
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: "new@b.com", googleSub: "g-999" },
      }),
    );
    expect(result.user.email).toBe("new@b.com");
  });
});

describe("AuthService.signInWithApple", () => {
  it("matches a returning user by apple sub even without an email", async () => {
    const { service, prisma } = makeService();
    mockedSocial.verifyAppleToken.mockResolvedValue({
      sub: "a-123",
      email: undefined,
      emailVerified: false,
    });
    prisma.user.findFirst.mockResolvedValue({
      id: "u1",
      email: "a@b.com",
      disabled: false,
    });

    const result = await service.signInWithApple("tok");
    expect(result.user.id).toBe("u1");
  });

  it("rejects a first-time Apple sign-in with no email", async () => {
    const { service, prisma } = makeService();
    mockedSocial.verifyAppleToken.mockResolvedValue({
      sub: "a-new",
      email: undefined,
      emailVerified: false,
    });
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.signInWithApple("tok")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
