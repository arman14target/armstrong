import { UnauthorizedException } from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { AdminAuthService } from "./admin-auth.service";

function makeService() {
  const prisma = { admin: { findUnique: jest.fn() } };
  const jwt = { sign: jest.fn().mockReturnValue("admin-token") };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const service = new AdminAuthService(prisma as any, jwt as any);
  return { service, prisma, jwt };
}

describe("AdminAuthService.signIn", () => {
  it("returns a token + admin for valid credentials", async () => {
    const { service, prisma } = makeService();
    prisma.admin.findUnique.mockResolvedValue({
      id: "a1",
      email: "boss@x.com",
      role: AdminRole.SUPERADMIN,
      disabled: false,
      passwordHash: await bcrypt.hash("StrongPass1", 4),
    });

    const result = await service.signIn("boss@x.com", "StrongPass1");
    expect(result.token).toBe("admin-token");
    expect(result.admin).toEqual({
      id: "a1",
      email: "boss@x.com",
      role: AdminRole.SUPERADMIN,
    });
  });

  it("rejects a disabled admin", async () => {
    const { service, prisma } = makeService();
    prisma.admin.findUnique.mockResolvedValue({
      id: "a1",
      email: "boss@x.com",
      role: AdminRole.ADMIN,
      disabled: true,
      passwordHash: await bcrypt.hash("StrongPass1", 4),
    });

    await expect(
      service.signIn("boss@x.com", "StrongPass1"),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a wrong password", async () => {
    const { service, prisma } = makeService();
    prisma.admin.findUnique.mockResolvedValue({
      id: "a1",
      email: "boss@x.com",
      role: AdminRole.ADMIN,
      disabled: false,
      passwordHash: await bcrypt.hash("StrongPass1", 4),
    });

    await expect(service.signIn("boss@x.com", "nope")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
