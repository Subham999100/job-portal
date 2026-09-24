import { UserRole, UserStatus } from '@prisma/client';

/**
 * RegisterResponseDto represents the sanitized response returned to the client upon successful registration.
 *
 * Security Guarantee:
 * Strictly excludes passwordHash, tokens, internal IDs, or raw database structures.
 */
export class RegisterResponseDto {
  id!: string;
  email!: string;
  role!: UserRole;
  status!: UserStatus;
  emailVerified!: boolean;
  createdAt!: Date;
}
