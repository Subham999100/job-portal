import { PasswordService } from '../../src/modules/auth/password.service';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  it('should hash a password using Argon2id with standard parameters', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
    // Argon2id hash format: $argon2id$v=19$m=65536,p=1,t=3$...
    expect(hash.startsWith('$argon2id$')).toBe(true);
    expect(hash).toContain('m=65536');
    expect(hash).toContain('t=3');
    expect(hash).toContain('p=1');
  });

  it('should generate distinct hashes for the same password due to unique random salting', async () => {
    const rawPassword = 'IdenticalPassword123!';
    const hash1 = await passwordService.hashPassword(rawPassword);
    const hash2 = await passwordService.hashPassword(rawPassword);

    expect(hash1).not.toBe(hash2);
  });

  it('should verify correct password against hash successfully', async () => {
    const rawPassword = 'ValidPassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isValid = await passwordService.verifyPassword(hash, rawPassword);
    expect(isValid).toBe(true);
  });

  it('should fail verification for incorrect password', async () => {
    const rawPassword = 'OriginalPassword123!';
    const hash = await passwordService.hashPassword(rawPassword);

    const isValid = await passwordService.verifyPassword(
      hash,
      'WrongPassword123!',
    );
    expect(isValid).toBe(false);
  });

  it('should return false gracefully on corrupted hash string', async () => {
    const isValid = await passwordService.verifyPassword(
      'corrupted-non-argon-hash',
      'password123',
    );
    expect(isValid).toBe(false);
  });
});
