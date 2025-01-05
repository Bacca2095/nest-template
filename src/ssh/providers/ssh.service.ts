// ssh.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class SshService {
  constructor(@InjectQueue('ssh') private sshQueue: Queue) {}

  async connectSsh(serverId: number): Promise<string> {
    await this.sshQueue.add('connect', { serverId });
    return `Job enqueued for serverId: ${serverId}`;
  }
}
