const { NestFactory } = require('@nestjs/core');
const { ValidationPipe, Logger } = require('@nestjs/common');
const { ConfigService } = require('@nestjs/config');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');
const { AppModule } = require('../dist/app.module');
const { HttpExceptionFilter } = require('../dist/common/filters/http-exception.filter');
const { TransformInterceptor } = require('../dist/common/interceptors/transform.interceptor');
const { SecurityHeadersMiddleware } = require('../dist/common/middleware/security-headers.middleware');

let cachedServer;

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    },
  });

  const configService = app.get(ConfigService);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  app.use(compression());
  app.use(cookieParser(configService.get('COOKIE_SECRET') || 'super-secret-cookie'));
  app.use(new SecurityHeadersMiddleware().use);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.setGlobalPrefix('api/v1');

  await app.init();
  logger.log('🚀 Serverless handler ready');

  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

module.exports = async (req, res) => {
  if (!cachedServer) {
    cachedServer = await bootstrap();
  }
  return cachedServer(req, res);
};
