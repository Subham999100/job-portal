import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * DatabaseModule manages data access infrastructure.
 * Marked as @Global() so that all domain modules in future phases
 * can inject PrismaService without explicit module re-imports.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
