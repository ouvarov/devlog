import { fileURLToPath } from 'node:url'

import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

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
})
export class AppModule {}
