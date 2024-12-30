import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

import { AsyncLocalStorageService } from './async-local-storage.service';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private readonly als: AsyncLocalStorageService) {
    super();

    this.$use(async (params, next) => {
      return this.auditMiddleware(params, next);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
  async onModuleInit() {
    await this.$connect();
  }

  async auditMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<any>,
  ) {
    const result = await next(params);

    const { userId, path, correlationId } = this.als.getRequestInfo();

    if (!userId) {
      return result;
    }

    let previousData: object | null = null;

    if (['update', 'delete'].includes(params.action)) {
      previousData = await this[params.model.toLowerCase()].findUnique({
        where: params.args.where,
      });
    }

    if (
      ['create', 'update', 'delete'].includes(params.action) &&
      params.model !== 'AuditLog'
    ) {
      const changes = params.args.data || null;

      await this.auditLog.create({
        data: {
          userId,
          action: params.action,
          table: params.model || 'unknown',
          recordId: result?.id,
          changes: {
            after: changes,
            before: previousData,
          },
          path,
          correlationId,
        },
      });
    }

    return result;
  }
}
