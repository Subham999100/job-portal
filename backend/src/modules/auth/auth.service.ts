import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RegisterResponseDto } from './dto/register-response.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';

/**
 * AuthService coordinates authentication operations for the modular monolith.
 *
 * Responsibilities:
 * - Public user registration with deterministic email normalization.
 * - Enforces server-side assignment of role (CANDIDATE) and status (PENDING_VERIFICATION).
 * - Safe error handling for duplicate email race conditions.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  /**
   * Deterministically normalizes an email address.
   * Strips surrounding whitespace and lowercases casing.
   *
   * @param email Raw email input
   * @returns Canonical normalized email string
   */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Registers a new user account.
   *
   * Security Guarantees:
   * 1. Email is normalized consistently before duplicate check and insertion.
   * 2. Role is strictly assigned server-side as CANDIDATE.
   * 3. Status is strictly assigned server-side as PENDING_VERIFICATION.
   * 4. Password is saved strictly as an Argon2id hash; raw password is never stored or logged.
   * 5. Prisma unique-constraint violations are captured and converted to safe ConflictException.
   * 6. Safe response mapping excludes sensitive fields and passwordHash.
   *
   * @param dto Validated registration payload containing email and password
   * @returns Sanitized RegisterResponseDto
   */
  async register(dto: RegisterDto): Promise<RegisterResponseDto> {
    const normalizedEmail = this.normalizeEmail(dto.email);

    // 1. Application-level duplicate check for fast-path feedback
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException(
        'An account with this email address already exists',
      );
    }

    // 2. Compute Argon2id password hash
    const passwordHash = await this.passwordService.hashPassword(dto.password);

    // 3. Persist User entity with authoritative server-controlled attributes
    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerifiedAt: null,
        },
      });

      this.logger.log(`User registered successfully: [${user.id}]`);

      // 4. Return safe sanitized response DTO
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerifiedAt !== null,
        createdAt: user.createdAt,
      };
    } catch (error) {
      // Handle concurrent registration race condition caught by database unique constraint
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email address already exists',
        );
      }
      throw error;
    }
  }
}
