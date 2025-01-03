import { Injectable } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

import { environment } from '../env/environment';

@Injectable()
export class OpenSearchService {
  private client: Client;

  constructor() {
    this.client = new Client({
      node: environment.opensearchUrl,
    });
  }

  async createIndex(indexName: string): Promise<void> {
    await this.client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
        },
        mappings: {
          properties: {
            timestamp: { type: 'date' },
            message: { type: 'text' },
            level: { type: 'keyword' },
            service: { type: 'keyword' },
            stackTrace: { type: 'text' },
          },
        },
      },
    });
  }

  async existsIndex(indexName: string): Promise<boolean> {
    const response = await this.client.indices.exists({
      index: indexName,
    });
    return response.body;
  }

  async logError(
    indexName: string,
    log: Record<string, unknown>,
  ): Promise<void> {
    if (!(await this.existsIndex(indexName))) {
      await this.createIndex(indexName);
    }
    await this.client.index({
      index: indexName,
      body: { ...log, timestamp: new Date() },
    });
  }
}
