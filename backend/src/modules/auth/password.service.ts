import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

/**
 * PasswordService encapsulates Argon2id password hashing and verification.
 *
 * Security Characteristics:
 * - Uses Argon2id variant (hybrid mode resistant against GPU/ASIC attacks and cache timing side-channels).
 * - Enforces memory-hard parameters: 64 MiB memory cost, 3 iterations, 1 parallelism lane.
 * - Constant-time verification prevents timing attacks.
 */
@Injectable()
export class PasswordService {
  /**
   * Hashes a plaintext password using Argon2id.
   *
   * @param password Plaintext password string
   * @returns Computed Argon2id hash string (including algorithm, version, parameters, salt, and digest)
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536, // 64 MiB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verifies a plaintext password against an Argon2 hash in constant time.
   *
   * @param hash Existing Argon2 hash string
   * @param plain Candidate plaintext password string
   * @returns True if candidate matches hash, false otherwise
   */
  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}
