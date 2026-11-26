import { fileURLToPath } from 'node:url'

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_PIPE } from '@nestjs/core'

import { ApiExceptionFilter } from './common/errors/api-exception.filter.js'
import { createSchemaValidationPipe } from './common/validation/schema-validation.pipe.js'
import { validateEnv } from './config/env.schema.js'
import { DbModule } from './db/db.module.js'
import { HealthModule } from './health/health.module.js'

const ROOT_ENV_FILE_PATH = fileURLToPath(new URL('../../../.env', import.meta.url))

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ROOT_ENV_FILE_PATH,
      validate: validateEnv,
    }),
    DbModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useFactory: createSchemaValidationPipe },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
