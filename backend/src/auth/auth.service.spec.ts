import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuthService } from "./auth.service";

function makeService() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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
});
