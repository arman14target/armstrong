#!/usr/bin/env node
/*
 * Create or update an admin account (bootstraps the first SUPERADMIN).
 *
 *   node scripts/create-admin.cjs <email> <password> [ADMIN|SUPERADMIN]
 *   npm run admin:create -- you@example.com 'StrongPass1' SUPERADMIN
 *
 * Reads DATABASE_URL from the environment (or backend/.env via the shell).
 * Idempotent: re-running updates the password + role for that email.
 */
const { PrismaClient, AdminRole } = require("@prisma/client");
const bcrypt = require("bcryptjs");

async function main() {
  const [email, password, roleArg] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      "Usage: node scripts/create-admin.cjs <email> <password> [ADMIN|SUPERADMIN]",
    );
    process.exit(1);
  }

  const role = (roleArg || "SUPERADMIN").toUpperCase();
  if (!AdminRole[role]) {
    console.error(`Invalid role "${role}". Use ADMIN or SUPERADMIN.`);
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, passwordHash, role },
      update: { passwordHash, role, disabled: false },
      select: { id: true, email: true, role: true },
    });
    console.log(`✓ Admin ready: ${admin.email} (${admin.role})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
