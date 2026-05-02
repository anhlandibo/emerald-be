import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from 'src/modules/audit/entities/audit-log.entity';

const SKIP_PATHS = ['/heath', '/metrics', '/favicon.io'];
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
];

@Injectable()
export class AuditInterceptor<T> implements NestInterceptor<T, T> {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T> | Promise<Observable<T>> {
    const req = context.switchToHttp().getRequest();
    const { method, path, body, ip, user } = req;

    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const isSkipped = SKIP_PATHS.some((p) => path.startsWith(p));

    if (!isWrite || isSkipped) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        this.saveLog(req, 'success', undefined);
      }),
      catchError((err: Error) => {
        this.saveLog(
          req,
          'failed',
          err?.message?.substring(0, 500) || undefined,
        );
        return throwError(() => err);
      }),
    );
  }

  private saveLog(req: any, status: string, errorMessage: string | undefined) {
    const { method, path, body, ip, user } = req;

    const logEntry = this.auditRepo.create({
      userId: user?.id ?? undefined,
      userEmail: user?.email ?? undefined,
      userRole: user?.role ?? undefined,
      method,
      path,
      payload: this.sanitize(body),
      ipAddress: req.headers['x-forwarded-for'] ?? ip,
      status,
      errorMessage,
    });

    this.auditRepo.save(logEntry).catch(console.error);
  }

  private sanitize(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') return {};

    const clean = { ...(body as Record<string, unknown>) };

    SENSITIVE_FIELDS.forEach((field) => {
      if (field in clean) {
        clean[field] = '[REDACTED]';
      }
    });

    return clean;
  }
}
