import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NodeSSH } from 'node-ssh';

import { MetricsGateway } from '@/metrics/gateways/metrics.gateway';
import { PrismaService } from '@/shared/providers/prisma.service';

@Processor('ssh')
export class SshProcessor {
  private readonly logger = new Logger(SshProcessor.name);
  constructor(
    private readonly db: PrismaService,
    private readonly metricsGateway: MetricsGateway,
  ) {}

  @Process('connect')
  async handleSshJob(job: Job<{ serverId: number }>): Promise<void> {
    const ssh = new NodeSSH();

    try {
      this.logger.log(`Processing job ${job.id}`);
      const serverCredential = await this.getServerCredential(
        job.data.serverId,
      );

      const connection = await this.establishConnection(
        ssh,
        serverCredential.host,
        serverCredential.password,
      );

      await this.uploadFiles(connection);
      this.logger.log('Files uploaded');
      const result = await this.executeScript(
        connection,
        serverCredential.host,
      );

      if (result.code !== 0) {
        throw new Error(result.stderr);
      }

      this.metricsGateway.notifySshCompletion(
        job.data.serverId,
        'success',
        result,
      );
    } catch (error) {
      this.logger.error(error['message']);
      this.metricsGateway.notifySshCompletion(
        job.data.serverId,
        'failure',
        error['message'],
      );
    } finally {
      ssh.dispose();
    }
  }

  private async getServerCredential(serverId: number) {
    console.log({ serverId });
    return await this.db.serverCredential.findUniqueOrThrow({
      where: { serverId },
    });
  }

  private async establishConnection(
    ssh: NodeSSH,
    host: string,
    password: string,
  ) {
    return await ssh.connect({
      host,
      username: 'root',
      password,
    });
  }

  private async uploadFiles(connection: NodeSSH) {
    await connection.putFile('docker-compose.yml', '/root/docker-compose.yml');
    await connection.putFile('config-server.sh', '/root/config-server.sh');
  }

  private async executeScript(connection: NodeSSH, ip: string) {
    await connection.execCommand('chmod +x /root/config-server.sh');
    const result = await connection.execCommand(`/root/config-server.sh ${ip}`);

    return result;
  }
}
