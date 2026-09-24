import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PlatformValidationPipe } from '../../src/common/pipes/validation.pipe';

describe('User Registration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    // Clean up any lingering test accounts from previous runs
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-e2e-reg.com' } },
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    const configService = app.get(ConfigService);
    const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');

    app.setGlobalPrefix(apiPrefix, {
      exclude: ['health'],
    });
    app.useGlobalPipes(new PlatformValidationPipe());
    app.useGlobalFilters(
      new AllExceptionsFilter(configService),
      new HttpExceptionFilter(),
    );

    await app.init();
  });

  afterAll(async () => {
    // Purge test records
    await prisma.user.deleteMany({
      where: { email: { contains: '@test-e2e-reg.com' } },
    });
    await prisma.$disconnect();
    await app.close();
  });

  // --------------------------------------------------------------------------
  // 1. Successful Registration
  // --------------------------------------------------------------------------
  it('1. POST /api/v1/auth/register should successfully register a new Candidate with safe response shape', async () => {
    const payload = {
      email: 'candidate1@test-e2e-reg.com',
      password: 'StrongPassword123!',
    };

    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(201);

    // Verify response payload shape
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe('candidate1@test-e2e-reg.com');
    expect(res.body.role).toBe(UserRole.CANDIDATE);
    expect(res.body.status).toBe(UserStatus.PENDING_VERIFICATION);
    expect(res.body.emailVerified).toBe(false);
    expect(res.body).toHaveProperty('createdAt');

    // Verify sensitive data is NOT returned in response
    expect(res.body.password).toBeUndefined();
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.sessionToken).toBeUndefined();

    // Verify database record
    const userInDb = await prisma.user.findUnique({
      where: { email: 'candidate1@test-e2e-reg.com' },
    });

    expect(userInDb).not.toBeNull();
    expect(userInDb?.role).toBe(UserRole.CANDIDATE);
    expect(userInDb?.status).toBe(UserStatus.PENDING_VERIFICATION);
    expect(userInDb?.emailVerifiedAt).toBeNull();
    expect(userInDb?.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(userInDb?.passwordHash).not.toBe(payload.password);

    // Verify NO session was created (Section 12 requirement)
    const sessions = await prisma.session.findMany({
      where: { userId: userInDb?.id },
    });
    expect(sessions).toHaveLength(0);
  });

  // --------------------------------------------------------------------------
  // 2. Email Normalization
  // --------------------------------------------------------------------------
  it('2. POST /api/v1/auth/register should normalize email by trimming whitespace and lowercasing', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: '   Normalized.Candidate@Test-E2E-Reg.COM   ',
        password: 'StrongPassword123!',
      })
      .expect(201);

    expect(res.body.email).toBe('normalized.candidate@test-e2e-reg.com');

    // Confirm stored in DB with canonical lowercase normalized form
    const userInDb = await prisma.user.findUnique({
      where: { email: 'normalized.candidate@test-e2e-reg.com' },
    });
    expect(userInDb).not.toBeNull();
  });

  // --------------------------------------------------------------------------
  // 3. Duplicate Email Rejection
  // --------------------------------------------------------------------------
  it('3. POST /api/v1/auth/register should return 409 Conflict when registering with duplicate email (even with different casing)', async () => {
    // Attempting registration with different casing of an existing user
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'NORMALIZED.CANDIDATE@test-e2e-reg.com',
        password: 'AnotherPassword456!',
      })
      .expect(409);

    expect(res.body).toHaveProperty('statusCode', 409);
    expect(res.body.message).toBe(
      'An account with this email address already exists',
    );
    expect(res.body.errorCode).toBe('CONFLICT');
  });

  // --------------------------------------------------------------------------
  // 4. Validation: Missing and Invalid Email
  // --------------------------------------------------------------------------
  it('4. POST /api/v1/auth/register should reject missing or invalid email format with 400', async () => {
    // Missing email
    const resMissing = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ password: 'StrongPassword123!' })
      .expect(400);

    expect(resMissing.body.errorCode).toBe('VALIDATION_FAILED');

    // Invalid email format
    const resInvalid = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        password: 'StrongPassword123!',
      })
      .expect(400);

    expect(resInvalid.body.errorCode).toBe('VALIDATION_FAILED');
  });

  // --------------------------------------------------------------------------
  // 5. Validation: Missing and Short/Long Password
  // --------------------------------------------------------------------------
  it('5. POST /api/v1/auth/register should reject missing or invalid length password with 400', async () => {
    // Missing password
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'nopass@test-e2e-reg.com' })
      .expect(400);

    // Password below min length (< 8 chars)
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'shortpass@test-e2e-reg.com',
        password: 'short',
      })
      .expect(400);

    // Password above max length (> 128 chars)
    const longPassword = 'A'.repeat(129);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'longpass@test-e2e-reg.com',
        password: longPassword,
      })
      .expect(400);
  });

  // --------------------------------------------------------------------------
  // 6. Security & Mass Assignment Rejection (Section 16 Test)
  // --------------------------------------------------------------------------
  it('6. POST /api/v1/auth/register should reject client-controlled role, status, and extra fields (Mass Assignment Protection)', async () => {
    // Malicious request attempting privilege escalation
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'attacker@test-e2e-reg.com',
        password: 'StrongPassword123!',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        userId: 'custom-uuid',
        permissions: ['ADMIN_ALL'],
      })
      .expect(400);

    // Rejected by validation pipe due to forbidNonWhitelisted: true
    expect(res.body.errorCode).toBe('VALIDATION_FAILED');

    // Confirm that NO user was created in the database
    const userInDb = await prisma.user.findUnique({
      where: { email: 'attacker@test-e2e-reg.com' },
    });
    expect(userInDb).toBeNull();
  });
});
