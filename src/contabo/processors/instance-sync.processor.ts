import { HttpService } from '@nestjs/axios';
import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { v4 } from 'uuid';

import { MetricsGateway } from '@/metrics/gateways/metrics.gateway';
import { environment } from '@/shared/env/environment';
import { PrismaService } from '@/shared/providers/prisma.service';

import { ContaboAuthService } from '../providers/contabo-auth.service';

@Injectable()
@Processor('sync')
export class InstanceSyncProcessor {
  private readonly logger = new Logger(InstanceSyncProcessor.name);

  constructor(
    private readonly http: HttpService,
    private readonly prisma: PrismaService,
    private readonly metricsGateway: MetricsGateway,
    private readonly contaboAuthService: ContaboAuthService,
  ) {}

  @Process('sync-servers')
  async syncServers(): Promise<void> {
    try {
      this.logger.log('Iniciando sincronización de servidores...');
      const url = `${environment.contaboApiUrl}/compute/instances`;
      const accessToken = await this.contaboAuthService.getAccessToken();

      const response = await lastValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-request-id': v4(),
          },
        }),
      );

      const serversFromApi = response.data.data;
      const existingServers = await this.prisma.serverCredential.findMany();

      for (const server of serversFromApi) {
        const existingServer = existingServers.find(
          (s) => s.serverId === server.instanceId,
        );

        if (existingServer) {
          await this.prisma.serverCredential.update({
            where: { id: existingServer.id },
            data: {
              name: server.displayName,
              password: 'unknown',
              host: server.ipConfig.v4.ip,
              updatedAt: new Date(),
            },
          });
        } else {
          await this.prisma.serverCredential.create({
            data: {
              name: server.displayName,
              password: 'unknown',
              host: server.ipConfig.v4.ip,
              serverId: server.instanceId,
              secretId: 1,
            },
          });
        }
      }

      const serverIdsFromApi = serversFromApi.map(
        (server) => server.instanceId,
      );
      const serversToDelete = existingServers.filter(
        (s) => !serverIdsFromApi.includes(s.serverId),
      );

      for (const server of serversToDelete) {
        await this.prisma.serverCredential.delete({ where: { id: server.id } });
      }

      this.logger.log('Sincronización de servidores completada.');

      this.metricsGateway.notifyServerSync('success', {
        message: 'Sincronización completada',
        totalServers: serversFromApi.length,
      });
    } catch (error) {
      console.log('Error during server sync:', error);
      this.logger.error('Error durante la sincronización de servidores', error);

      this.metricsGateway.notifyServerSync('failure', {
        message: 'Error durante la sincronización de servidores',
        error: error['message'],
      });
    }
  }
}
