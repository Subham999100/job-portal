import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { appConfig } from './app.config';
import { validateEnvironment } from './env.validation';

/**
 * AppConfigModule encapsulates application configuration initialization.
 * It is designated as global so any module across the modular monolith can
 * inject ConfigService without repeating module imports.
 */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnvironment,
      envFilePath: ['.env', '.env.local'],
      cache: true,
    }),
  ],
})
export class AppConfigModule {}
