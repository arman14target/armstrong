import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AdminService } from "./admin.service";

function makeService() {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    admin: { findUnique: jest.fn(), update: jest.fn() },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { service: new AdminService(prisma as any), prisma };
}

describe("AdminService user management", () => {
  it("throws when disabling a missing user", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.setUserDisabled("nope", true)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("disables an existing user", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue({ id: "u1" });
    prisma.user.update.mockResolvedValue({ id: "u1", disabled: true });
    await service.setUserDisabled("u1", true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { disabled: true } }),
    );
  });

  it("throws when deleting a missing user", async () => {
    const { service, prisma } = makeService();
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.deleteUser("nope")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe("AdminService admin management", () => {
  it("refuses to let an admin disable their own account", async () => {
    const { service } = makeService();
    await expect(
      service.setAdminDisabled("a1", true, "a1"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when disabling a missing admin", async () => {
    const { service, prisma } = makeService();
    prisma.admin.findUnique.mockResolvedValue(null);
    await expect(
      service.setAdminDisabled("a2", true, "a1"),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
