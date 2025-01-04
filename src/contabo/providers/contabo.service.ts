import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { NodeSSH } from 'node-ssh';
import { lastValueFrom } from 'rxjs';
import { v4 } from 'uuid';

import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { environment } from '@/shared/env/environment';
import { PrismaService } from '@/shared/providers/prisma.service';

import { CreateServerDto } from '../dto/create-server.dto';
import { ResetServerDto } from '../dto/reset-server.dto';

@Injectable()
export class ContaboService {
  constructor(
    private readonly http: HttpService,
    private readonly db: PrismaService,
  ) {}

  @HandleExceptions()
  private async getAccessToken() {
    const url = environment.contaboAuthUrl;

    const payload = new URLSearchParams({
      client_id: environment.contaboClientId,
      client_secret: environment.contaboClientSecret,
      username: environment.contaboApiUser,
      password: environment.contaboApiPassword,
      grant_type: 'password',
    });

    const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
      this.http.post(url, payload.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    return response.data.access_token;
  }

  @HandleExceptions()
  async createServer(dto: CreateServerDto) {
    const { name, password } = dto;
    const url = `${environment.contaboApiUrl}/compute/instances`;

    const accessToken = await this.getAccessToken();
    const secretId = await this.createSecret(password, name);

    const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
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
            'x-request-id': v4(),
          },
        },
      ),
    );

    await this.db.serverCredential.create({
      data: {
        name,
        password,
        secretId,
        serverId: response.data.data[0].instanceId,
        host: response.data.data[0].ipConfig.v4.ip,
      },
    });

    return response.data;
  }

  @HandleExceptions()
  async createSecret(password: string, name: string) {
    const accessToken = await this.getAccessToken();
    const secretUrl = `${environment.contaboApiUrl}/secrets`;
    const secret: AxiosResponse<Record<string, any>> = await lastValueFrom(
      this.http.post(
        secretUrl,
        { name, value: password, type: 'password' },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-request-id': v4(),
          },
        },
      ),
    );

    return secret.data.data[0].secretId;
  }

  @HandleExceptions()
  async updateSecretName(secretId: number, name: string) {
    const accessToken = await this.getAccessToken();
    const secretUrl = `${environment.contaboApiUrl}/secrets/${secretId}`;
    await lastValueFrom(
      this.http.patch(
        secretUrl,
        { name },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-request-id': v4(),
          },
        },
      ),
    );
  }

  @HandleExceptions()
  async updateServerName(serverId: number, name: string) {
    const accessToken = await this.getAccessToken();
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
  }

  @HandleExceptions()
  async resetServer(serverId: number, dto: ResetServerDto) {
    const { name } = dto;
    const url = `${environment.contaboApiUrl}/compute/instances`;
    const serverCredential = await this.db.serverCredential.findUniqueOrThrow({
      where: { serverId },
    });

    const accessToken = await this.getAccessToken();
    await this.updateSecretName(serverCredential.secretId, name);
    await this.updateServerName(serverId, name);

    const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
      this.http.put(
        `${url}/${serverId}`,
        {
          imageId: '66abf39a-ba8b-425e-a385-8eb347ceac10',
          rootPassword: serverCredential.secretId,
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

    await this.db.serverCredential.update({
      where: { serverId },
      data: {
        name,
      },
    });

    return response.data;
  }

  @HandleExceptions()
  async getServerList() {
    const url = `${environment.contaboApiUrl}/compute/instances`;

    const accessToken = await this.getAccessToken();

    const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
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
  async connectSsh(serverId: number) {
    const url = `${environment.contaboApiUrl}/compute/instances/${serverId}`;
    const ssh = new NodeSSH();

    const serverCredential = await this.db.serverCredential.findUniqueOrThrow({
      where: { serverId },
    });

    const accessToken = await this.getAccessToken();

    const serverResponse: AxiosResponse<Record<string, any>> =
      await lastValueFrom(
        this.http.get(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'x-request-id': v4(),
          },
        }),
      );

    const connection = await ssh.connect({
      host: serverCredential.host,
      username: 'root',
      password: serverCredential.password,
    });

    const uploadScript = await connection.putFile(
      'config-server.sh',
      '/root/config-server.sh',
    );
    console.log('Script uploaded:', uploadScript);

    const uploadDockerCompose = await connection.putFile(
      'docker-compose.yml',
      '/root/docker-compose.yml',
    );
    console.log('Docker Compose file uploaded:', uploadDockerCompose);

    const chmodScript = await connection.execCommand(
      'chmod +x /root/config-server.sh',
    );
    console.log('Script chmod:', chmodScript);

    const executeScript = await connection.execCommand(
      `/root/config-server.sh ${serverCredential.host}`,
    );
    console.log('Script execution:', executeScript);

    return serverResponse.data;
  }

  @HandleExceptions()
  async getImagesList() {
    const url = `${environment.contaboApiUrl}/compute/images`;

    const accessToken = await this.getAccessToken();

    const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
      this.http.get(url, {
        params: {
          standardImage: true,
          size: 60,
          name: 'debian',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'x-request-id': v4(),
        },
      }),
    );

    return response.data;
  }
}
