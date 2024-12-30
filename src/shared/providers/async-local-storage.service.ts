import { AsyncLocalStorage } from 'async_hooks';

import { Injectable } from '@nestjs/common';

interface RequestInfo {
  userId: number;
  correlationId: string;
  path: string;
}

@Injectable()
export class AsyncLocalStorageService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<
    Map<string, any>
  >();

  run(fn: () => void) {
    this.asyncLocalStorage.run(new Map(), fn);
  }

  set<T>(key: string, value: T) {
    const store: Map<string, T> = this.asyncLocalStorage.getStore();
    if (store) {
      store.set(key, value);
    }
  }

  get<T>(key: string): T | undefined {
    const store: Map<string, T> = this.asyncLocalStorage.getStore();
    return store ? (store.get(key) as T) : undefined;
  }

  getRequestInfo(): RequestInfo {
    const store = this.asyncLocalStorage.getStore();
    return {
      userId: store?.get('userId'),
      correlationId: store?.get('correlationId'),
      path: store?.get('path'),
    };
  }
}
