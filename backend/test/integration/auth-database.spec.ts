import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import { randomUUID, createHash } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Phase 1A: Authentication Database Foundation Integration Tests
 *
 * Verifies the database schema, constraints, relationships, enums,
 * nullability, defaults, and cascade semantics against real PostgreSQL.
 */
describe('Auth Database Foundation (Phase 1A)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    // Final cleanup of any test user records
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-phase1a.com' } },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Isolate test cases by deleting test-scoped records
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-phase1a.com' } },
    });
  });

  const generateTestEmail = (): string =>
    `user-${randomUUID()}@test-phase1a.com`;

  const hashToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex');

  // --------------------------------------------------------------------------
  // 1. User Email Uniqueness
  // --------------------------------------------------------------------------
  it('1. should enforce database uniqueness on user email', async () => {
    const email = generateTestEmail();

    await prisma.user.create({
      data: {
        email,
        passwordHash: 'dummy_hash_1',
      },
    });

    // Attempting to insert duplicate email must throw Prisma P2002 error
    await expect(
      prisma.user.create({
        data: {
          email,
          passwordHash: 'dummy_hash_2',
        },
      }),
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 2. User -> Session Relationship and Cascade Deletion
  // --------------------------------------------------------------------------
  it('2. should associate Sessions with User and cascade delete sessions on user removal', async () => {
    const user = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'dummy_hash',
      },
    });

    const tokenHash = hashToken(randomUUID());
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash: tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    expect(session.userId).toBe(user.id);
    expect(session.sessionTokenHash).toBe(tokenHash);

    // Verify relationship lookup via User include
    const userWithSessions = await prisma.user.findUnique({
      where: { id: user.id },
      include: { sessions: true },
    });
    expect(userWithSessions?.sessions).toHaveLength(1);
    expect(userWithSessions?.sessions[0].id).toBe(session.id);

    // Verify Cascade Delete: Deleting user must automatically remove associated sessions
    await prisma.user.delete({ where: { id: user.id } });

    const orphanedSession = await prisma.session.findUnique({
      where: { id: session.id },
    });
    expect(orphanedSession).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 3. User -> PasswordResetToken Relationship and Cascade Deletion
  // --------------------------------------------------------------------------
  it('3. should associate PasswordResetToken with User and cascade delete on user removal', async () => {
    const user = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'dummy_hash',
      },
    });

    const tokenHash = hashToken(randomUUID());
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
      },
    });

    expect(resetToken.userId).toBe(user.id);
    expect(resetToken.usedAt).toBeNull();

    // Verify relationship via User include
    const userWithResetTokens = await prisma.user.findUnique({
      where: { id: user.id },
      include: { passwordResetTokens: true },
    });
    expect(userWithResetTokens?.passwordResetTokens).toHaveLength(1);
    expect(userWithResetTokens?.passwordResetTokens[0].id).toBe(resetToken.id);

    // Verify Cascade Delete
    await prisma.user.delete({ where: { id: user.id } });

    const orphanedToken = await prisma.passwordResetToken.findUnique({
      where: { id: resetToken.id },
    });
    expect(orphanedToken).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 4. User -> EmailVerificationToken Relationship and Cascade Deletion
  // --------------------------------------------------------------------------
  it('4. should associate EmailVerificationToken with User and cascade delete on user removal', async () => {
    const user = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'dummy_hash',
      },
    });

    const tokenHash = hashToken(randomUUID());
    const verificationToken = await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    expect(verificationToken.userId).toBe(user.id);
    expect(verificationToken.usedAt).toBeNull();

    // Verify relationship via User include
    const userWithVerificationTokens = await prisma.user.findUnique({
      where: { id: user.id },
      include: { emailVerificationTokens: true },
    });
    expect(userWithVerificationTokens?.emailVerificationTokens).toHaveLength(1);
    expect(userWithVerificationTokens?.emailVerificationTokens[0].id).toBe(
      verificationToken.id,
    );

    // Verify Cascade Delete
    await prisma.user.delete({ where: { id: user.id } });

    const orphanedToken = await prisma.emailVerificationToken.findUnique({
      where: { id: verificationToken.id },
    });
    expect(orphanedToken).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 5. Session Token Hash Uniqueness
  // --------------------------------------------------------------------------
  it('5. should enforce uniqueness on sessionTokenHash', async () => {
    const user1 = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'dummy_hash',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'dummy_hash',
      },
    });

    const duplicateTokenHash = hashToken('same_raw_token');

    await prisma.session.create({
      data: {
        userId: user1.id,
        sessionTokenHash: duplicateTokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });

    // Creating second session with identical token hash must fail
    await expect(
      prisma.session.create({
        data: {
          userId: user2.id,
          sessionTokenHash: duplicateTokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      }),
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 6. Required Fields & Default Values Behavior
  // --------------------------------------------------------------------------
  it('6. should apply sensible defaults for required fields', async () => {
    const user = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'hashed_password_123',
      },
    });

    // Defaults check
    expect(user.role).toBe(UserRole.CANDIDATE);
    expect(user.status).toBe(UserStatus.PENDING_VERIFICATION);
    expect(user.failedLoginAttempts).toBe(0);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);

    // Session defaults check
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash: hashToken(randomUUID()),
        expiresAt: new Date(Date.now() + 600000),
      },
    });

    expect(session.createdAt).toBeInstanceOf(Date);
    expect(session.lastActiveAt).toBeInstanceOf(Date);
  });

  // --------------------------------------------------------------------------
  // 7. Nullable Fields Behavior
  // --------------------------------------------------------------------------
  it('7. should correctly handle nullable fields on User, Session, and Tokens', async () => {
    // Test with nulls
    const user = await prisma.user.create({
      data: {
        email: generateTestEmail(),
        passwordHash: 'hashed_password',
        emailVerifiedAt: null,
        lockoutUntil: null,
        passwordChangedAt: null,
      },
    });

    expect(user.emailVerifiedAt).toBeNull();
    expect(user.lockoutUntil).toBeNull();
    expect(user.passwordChangedAt).toBeNull();

    // Test with non-null values
    const now = new Date();
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: now,
        lockoutUntil: now,
        passwordChangedAt: now,
      },
    });

    expect(updatedUser.emailVerifiedAt).toEqual(now);
    expect(updatedUser.lockoutUntil).toEqual(now);
    expect(updatedUser.passwordChangedAt).toEqual(now);

    // Session nullable fields
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        sessionTokenHash: hashToken(randomUUID()),
        expiresAt: new Date(Date.now() + 600000),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    expect(session.ipAddress).toBe('192.168.1.1');
    expect(session.userAgent).toBe('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');

    // Tokens usedAt nullable field
    const resetToken = await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(randomUUID()),
        expiresAt: new Date(Date.now() + 600000),
        usedAt: null,
      },
    });
    expect(resetToken.usedAt).toBeNull();

    const usedResetToken = await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: now },
    });
    expect(usedResetToken.usedAt).toEqual(now);
  });

  // --------------------------------------------------------------------------
  // 8. Role Enum Rejection of Unsupported Values
  // --------------------------------------------------------------------------
  it('8. should support exactly the five required roles and reject unsupported roles', async () => {
    const roles = [
      UserRole.CANDIDATE,
      UserRole.RECRUITER,
      UserRole.EMPLOYEE,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    expect(roles).toEqual([
      'CANDIDATE',
      'RECRUITER',
      'EMPLOYEE',
      'ADMIN',
      'SUPER_ADMIN',
    ]);

    for (const role of roles) {
      const u = await prisma.user.create({
        data: {
          email: generateTestEmail(),
          passwordHash: 'dummy',
          role,
        },
      });
      expect(u.role).toBe(role);
    }

    // Invalid role rejection at database level
    await expect(
      prisma.$executeRaw`
        INSERT INTO "users" ("id", "email", "passwordHash", "role", "status", "updatedAt")
        VALUES (gen_random_uuid(), ${generateTestEmail()}, 'dummy', 'UNSUPPORTED_ROLE'::"UserRole", 'ACTIVE'::"UserStatus", NOW());
      `,
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 9. Status Enum Rejection of Unsupported Values
  // --------------------------------------------------------------------------
  it('9. should support exactly the four required statuses and reject unsupported statuses', async () => {
    const statuses = [
      UserStatus.PENDING_VERIFICATION,
      UserStatus.ACTIVE,
      UserStatus.SUSPENDED,
      UserStatus.DISABLED,
    ];

    expect(statuses).toEqual([
      'PENDING_VERIFICATION',
      'ACTIVE',
      'SUSPENDED',
      'DISABLED',
    ]);

    for (const status of statuses) {
      const u = await prisma.user.create({
        data: {
          email: generateTestEmail(),
          passwordHash: 'dummy',
          status,
        },
      });
      expect(u.status).toBe(status);
    }

    // Invalid status rejection at database level
    await expect(
      prisma.$executeRaw`
        INSERT INTO "users" ("id", "email", "passwordHash", "role", "status", "updatedAt")
        VALUES (gen_random_uuid(), ${generateTestEmail()}, 'dummy', 'CANDIDATE'::"UserRole", 'INVALID_STATUS'::"UserStatus", NOW());
      `,
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 10. Migration Works Successfully & Tables Exist in Database
  // --------------------------------------------------------------------------
  it('10. should confirm all Phase 1A tables exist in PostgreSQL information_schema', async () => {
    const tables: Array<{ table_name: string }> = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'sessions', 'password_reset_tokens', 'email_verification_tokens')
      ORDER BY table_name;
    `;

    const tableNames = tables.map((t) => t.table_name);
    expect(tableNames).toContain('users');
    expect(tableNames).toContain('sessions');
    expect(tableNames).toContain('password_reset_tokens');
    expect(tableNames).toContain('email_verification_tokens');
  });
});
