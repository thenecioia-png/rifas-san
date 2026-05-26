import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const startTime = Date.now();

    const sensitiveFields = ['password', 'token', 'creditCard', 'cvv', 'secret'];
    const sanitizeBody = (body: any): any => {
      if (!body || typeof body !== 'object') return body;
      const sanitized = { ...body };
      sensitiveFields.forEach((field) => {
        if (field in sanitized) sanitized[field] = '[REDACTED]';
      });
      return sanitized;
    };

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        
        // Only audit state-changing operations
        const method = request.method;
        if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
          return;
        }

        try {
          await this.auditService.log({
            userId: user?.id,
            action: this.mapMethodToAction(method),
            entityType: context.getClass().name,
            entityId: request.params?.id,
            description: `${method} ${request.path}`,
            ipAddress: request.ip || request.headers['x-forwarded-for'] || 'unknown',
            userAgent: request.headers['user-agent'] || 'unknown',
            requestMethod: method,
            requestPath: request.path,
            requestBody: sanitizeBody(request.body),
            statusCode: context.switchToHttp().getResponse().statusCode,
            durationMs: duration,
          });
        } catch (error) {
          // Fail silently - don't break the request if audit fails
          console.error('Audit logging failed:', error);
        }
      }),
    );
  }

  private mapMethodToAction(method: string): any {
    const mapping = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };
    return mapping[method] || 'UPDATE';
  }
}
