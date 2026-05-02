import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  async findAll(dto: QueryAuditLogDto) {
    const { userId, userRole, method, path, status, from, to } = dto;
    const page = Math.max(1, dto.page ?? 1);
    const limit = Math.min(200, dto.limit ?? 50);

    const qb = this.repo
      .createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (userId) qb.andWhere('log.userId = :userId', { userId });
    if (userRole) qb.andWhere('log.userRole = :userRole', { userRole });
    if (method) qb.andWhere('log.method = :method', { method });
    if (status) qb.andWhere('log.status = :status', { status });
    if (path) qb.andWhere('log.path ILIKE :path', { path: `%${path}%` });
    if (from) qb.andWhere('log.createdAt >= :from', { from: new Date(from) });
    if (to) qb.andWhere('log.createdAt <= :to', { to: new Date(to) });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async exportCsv(dto: QueryAuditLogDto): Promise<string> {
    const result = await this.findAll({ ...dto, limit: 10000, page: 1 });

    const header =
      'id,userId,userEmail,userRole,method,path,status,ipAddress,createdAt';
    const rows = result.data.map((log) =>
      [
        log.id,
        log.userId,
        log.userEmail,
        log.userRole,
        log.method,
        log.path,
        log.status,
        log.ipAddress,
        log.createdAt.toISOString(),
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
