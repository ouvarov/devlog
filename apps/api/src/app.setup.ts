import type { NestExpressApplication } from '@nestjs/platform-express'

// The largest valid batch (20 creates with 5000-char Cyrillic descriptions) is about 200 kB.
const JSON_BODY_LIMIT = '256kb'

const configureHttp = (app: NestExpressApplication): void => {
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT })
}

export { configureHttp }
