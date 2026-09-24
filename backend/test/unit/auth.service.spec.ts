import { ConflictException } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../src/database/prisma.service';
import { AuthService } from '../../src/modules/auth/auth.service';
import { PasswordService } from '../../src/modules/auth/password.service';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let mockPrismaService: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let mockPasswordService: {
    hashPassword: jest.Mock;
    verifyPassword: jest.Mock;
  };

  beforeEach(() => {
    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    mockPasswordService = {
      hashPassword: jest
        .fn()
        .mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=1$mocked_hash'),
      verifyPassword: jest.fn(),
    };

    authService = new AuthService(
      mockPrismaService as unknown as PrismaService,
      mockPasswordService as unknown as PasswordService,
    );
  });

  describe('normalizeEmail', () => {
    it('should strip surrounding whitespace and lowercase casing', () => {
      expect(authService.normalizeEmail('   Candidate@Example.COM   ')).toBe(
        'candidate@example.com',
      );
      expect(authService.normalizeEmail('USER.NAME+tag@DOMAIN.CO.UK')).toBe(
        'user.name+tag@domain.co.uk',
      );
    });
  });

  describe('register', () => {
    it('should register a new user with server-assigned CANDIDATE role and PENDING_VERIFICATION status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newuser@example.com',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$mocked_hash',
        role: UserRole.CANDIDATE,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerifiedAt: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        passwordChangedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        email: '   NewUser@Example.COM  ',
        password: 'StrongPassword123!',
      });

      // Email was normalized
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'newuser@example.com' },
      });

      // Password was hashed via PasswordService
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(
        'StrongPassword123!',
      );

      // Server explicitly assigned role and status
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'newuser@example.com',
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$mocked_hash',
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerifiedAt: null,
        },
      });

      // Response contains safe mapped properties only
      expect(result).toEqual({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newuser@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerified: false,
        createdAt: expect.any(Date),
      });

      // Response strictly excludes sensitive data
      expect((result as any).password).toBeUndefined();
      expect((result as any).passwordHash).toBeUndefined();
    });

    it('should throw ConflictException if email already exists during application check', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'taken@example.com',
      });

      await expect(
        authService.register({
          email: 'taken@example.com',
          password: 'StrongPassword123!',
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should catch database unique constraint violation (P2002) and throw safe ConflictException', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const prismaKnownError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: '6.4.1',
        },
      );
      mockPrismaService.user.create.mockRejectedValue(prismaKnownError);

      await expect(
        authService.register({
          email: 'racing@example.com',
          password: 'StrongPassword123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should ignore any client-supplied role or status injected into the register call', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'attacker-id',
        email: 'attacker@example.com',
        role: UserRole.CANDIDATE,
        status: UserStatus.PENDING_VERIFICATION,
        emailVerifiedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Malicious payload attempting privilege escalation
      const maliciousPayload: any = {
        email: 'attacker@example.com',
        password: 'StrongPassword123!',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        userId: 'fake-id',
        permissions: ['ALL'],
      };

      await authService.register(maliciousPayload);

      // Verify server strictly overwrote with safe defaults
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'attacker@example.com',
          passwordHash: expect.any(String),
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerifiedAt: null,
        },
      });
    });
  });
});
