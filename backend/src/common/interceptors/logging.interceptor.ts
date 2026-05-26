import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('user-agent') || 'unknown';
    const ip = request.ip || request.headers['x-forwarded-for'] || 'unknown';
    const userId = request.user?.id || 'anonymous';
    
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = Date.now() - now;

        const logMessage = `[${method}] ${url} ${statusCode} - ${duration}ms | User: ${userId} | IP: ${ip} | UA: ${userAgent}`;

        if (statusCode >= 500) {
          this.logger.error(logMessage);
        } else if (statusCode >= 400) {
          this.logger.warn(logMessage);
        } else {
          this.logger.log(logMessage);
        }
      }),
    );
  }
}
