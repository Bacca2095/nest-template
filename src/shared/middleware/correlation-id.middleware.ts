import { randomUUID } from 'crypto';

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { AsyncLocalStorageService } from '../providers/async-local-storage.service';

export const CORRELATION_ID_HEADER: string = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  constructor(private readonly als: AsyncLocalStorageService) {}
  public use(req: Request, res: Response, next: NextFunction) {
    const id: string = randomUUID();
    req[CORRELATION_ID_HEADER] = id;
    res.set(CORRELATION_ID_HEADER, id);
    next();
  }
}
