import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "@prisma/client";
import { RolesGuard } from "./roles.guard";

function contextFor(role?: AdminRole): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { id: "a", role } : undefined }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function guardWith(required: AdminRole[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe("RolesGuard", () => {
  it("allows any admin when no roles are required", () => {
    expect(guardWith(undefined).canActivate(contextFor(AdminRole.ADMIN))).toBe(
      true,
    );
  });

  it("allows an admin that has the required role", () => {
    expect(
      guardWith([AdminRole.ADMIN]).canActivate(contextFor(AdminRole.ADMIN)),
    ).toBe(true);
  });

  it("lets SUPERADMIN through routes that require ADMIN", () => {
    expect(
      guardWith([AdminRole.ADMIN]).canActivate(
        contextFor(AdminRole.SUPERADMIN),
      ),
    ).toBe(true);
  });

  it("blocks ADMIN from SUPERADMIN-only routes", () => {
    expect(() =>
      guardWith([AdminRole.SUPERADMIN]).canActivate(
        contextFor(AdminRole.ADMIN),
      ),
    ).toThrow(ForbiddenException);
  });
});
