import { HttpService } from '@nestjs/axios';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { Queue } from 'bull';
import { lastValueFrom } from 'rxjs';
import { v4 } from 'uuid';

import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { environment } from '@/shared/env/environment';
import { PrismaService } from '@/shared/providers/prisma.service';

import { ContaboAuthService } from './contabo-auth.service';
import { ContaboSecretService } from './contabo-secret.service';
import { CreateServerDto } from '../dto/create-server.dto';
import { ResetServerDto } from '../dto/reset-server.dto';

@Injectable()
export class ContaboInstanceService {
  constructor(
    private readonly http: HttpService,
    private readonly db: PrismaService,
    private readonly authService: ContaboAuthService,
    private readonly secretService: ContaboSecretService,
    @InjectQueue('ssh') private sshQueue: Queue,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}

  @HandleExceptions()
  async createServer(dto: CreateServerDto): Promise<any> {
    const { name, password } = dto;

    const accessToken = await this.authService.getAccessToken();
    const secretId = await this.secretService.createSecret(password, name);
    const response = await this.createContaboInstance(
      accessToken,
      name,
      secretId,
    );

    await this.saveServerCredentials(name, password, secretId, response);

    await this.sshQueue.add('connect', {
      serverId: response.data.data[0].instanceId,
    });

    return response.data;
  }

  @HandleExceptions()
  async getServerList(): Promise<any> {
    const url = `${environment.contaboApiUrl}/compute/instances`;
    const accessToken = await this.authService.getAccessToken();

    const response = await lastValueFrom(
      this.http.get(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-request-id': v4(),
        },
      }),
    );

    return response.data;
  }

  @HandleExceptions()
  async resetServer(serverId: number, dto: ResetServerDto): Promise<any> {
    const { name } = dto;

    const serverCredential = await this.db.serverCredential.findUniqueOrThrow({
      where: { serverId },
    });

    const secretId = await this.getOrCreateSecret(serverCredential, name);
    const accessToken = await this.authService.getAccessToken();

    await this.updateServerName(serverId, name);
    const response = await this.resetContaboInstance(
      accessToken,
      serverId,
      secretId,
    );

    await this.db.serverCredential.update({
      where: { serverId },
      data: { name },
    });

    await this.sshQueue.add(
      'connect',
      { serverId },
      { delay: 600000, attempts: 3 },
    );

    return response.data;
  }

  @HandleExceptions()
  async syncServers(): Promise<{ status: string }> {
    await this.syncQueue.add('sync-servers');
    return { status: 'success' };
  }

  @HandleExceptions()
  async updateServerName(serverId: number, name: string): Promise<void> {
    const accessToken = await this.authService.getAccessToken();
    const url = `${environment.contaboApiUrl}/compute/instances/${serverId}`;

    await lastValueFrom(
      this.http.patch(
        url,
        { displayName: name },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-request-id': v4(),
          },
        },
      ),
    );

    await this.db.serverCredential.update({
      where: { serverId },
      data: { name },
    });
  }

  private async createContaboInstance(
    accessToken: string,
    name: string,
    secretId: number,
  ): Promise<AxiosResponse<any>> {
    const url = `${environment.contaboApiUrl}/compute/instances`;

    return await lastValueFrom(
      this.http.post(
        url,
        {
          imageId: '66abf39a-ba8b-425e-a385-8eb347ceac10',
          productId: 'V45',
          region: 'US-central',
          sshKeys: [environment.contaboDefaultSshId],
          rootPassword: secretId,
          period: 1,
          displayName: name,
          defaultUser: 'root',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      ),
    );
  }

  private async getOrCreateSecret(
    serverCredential: any,
    name: string,
  ): Promise<string> {
    let secretId = serverCredential.secretId;
    const defaultPassword = 'RootPassword';

    if (serverCredential.password === 'unknown' && secretId === 1) {
      secretId = await this.secretService.createSecret(defaultPassword, name);
      await this.db.serverCredential.update({
        where: { serverId: serverCredential.serverId },
        data: { secretId, password: defaultPassword },
      });
    } else {
      await this.secretService.updateSecretName(secretId, name);
    }

    return secretId;
  }

  private async resetContaboInstance(
    accessToken: string,
    serverId: number,
    secretId: string,
  ): Promise<AxiosResponse<any>> {
    const url = `${environment.contaboApiUrl}/compute/instances/${serverId}`;

    return await lastValueFrom(
      this.http.put(
        url,
        {
          imageId: '66abf39a-ba8b-425e-a385-8eb347ceac10',
          rootPassword: secretId,
          defaultUser: 'root',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-request-id': v4(),
          },
        },
      ),
    );
  }

  private async saveServerCredentials(
    name: string,
    password: string,
    secretId: number,
    response: AxiosResponse<any>,
  ): Promise<void> {
    await this.db.serverCredential.create({
      data: {
        name,
        password,
        secretId,
        serverId: response.data.data[0].instanceId,
        host: response.data.data[0].ipConfig.v4.ip,
      },
    });
  }
}
