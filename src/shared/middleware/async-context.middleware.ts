import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { CORRELATION_ID_HEADER } from './correlation-id.middleware';
import { AsyncLocalStorageService } from '../providers/async-local-storage.service';

@Injectable()
export class AsyncContextMiddleware implements NestMiddleware {
  constructor(private readonly als: AsyncLocalStorageService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.originalUrl;
    const correlationId = res.getHeaders()[CORRELATION_ID_HEADER];
    this.als.run(() => {
      this.als.set('path', path);
      this.als.set('correlationId', correlationId);
      next();
    });
  }
}
