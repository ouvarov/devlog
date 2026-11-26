import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'

import { AppModule } from './app.module.js'
import { configureHttp } from './app.setup.js'
import type { Env } from './config/env.schema.js'

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  configureHttp(app)
  const config = app.get<ConfigService<Env, true>>(ConfigService)

  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }) })
  app.enableShutdownHooks()

  const port = config.get('PORT', { infer: true })
  await app.listen(port)
  Logger.log(`API listening on http://localhost:${port}`, 'Bootstrap')
}

await bootstrap()
