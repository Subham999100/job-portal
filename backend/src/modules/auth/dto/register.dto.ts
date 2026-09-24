import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * RegisterDto defines the strict incoming payload for public user registration.
 *
 * Security Guarantee:
 * Contains ONLY email and password. Any extraneous fields (e.g. role, status, userId, permissions)
 * are rejected by PlatformValidationPipe (forbidNonWhitelisted: true), eliminating mass assignment risks.
 */
export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'A valid email address must be provided' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  password!: string;
}
