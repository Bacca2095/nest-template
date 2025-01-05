import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SystemMetricsDto } from '../dto/metrics.dto';
import { MetricsService } from '../providers/metrics.service';

@WebSocketGateway({ cors: true })
export class MetricsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MetricsGateway.name);

  private intervalId: NodeJS.Timeout | null = null;

  constructor(private readonly metricsService: MetricsService) {}

  afterInit() {
    this.logger.log('WebSocket Gateway Initialized');
    this.startMetricsBroadcast();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('welcome', 'Welcome to the WebSocket Server');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('metrics')
  async handleMetricsRequest(client: Socket): Promise<void> {
    const metrics: SystemMetricsDto = await this.metricsService.getAllMetrics();
    client.emit('metrics', metrics);
  }

  notifySshCompletion(serverId: number, status: string, result?: any) {
    this.server.emit('ssh-completion', { serverId, status, result });
    this.logger.log(
      `Notified clients about SSH completion for serverId: ${serverId}`,
    );
  }

  notifyServerSync(status: string, data: any) {
    this.server.emit('sync-status', { status, ...data });
  }

  private startMetricsBroadcast() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      const metrics: SystemMetricsDto =
        await this.metricsService.getAllMetrics();
      this.server.emit('metrics', metrics);
    }, 5000);
  }
}
