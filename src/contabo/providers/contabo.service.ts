import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AxiosError, AxiosResponse } from 'axios';
import { NodeSSH } from 'node-ssh';
import { lastValueFrom } from 'rxjs';
import { v4 } from 'uuid';

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

  private async getAccessToken() {
    const url = environment.contaboAuthUrl;

    const payload = new URLSearchParams({
      client_id: environment.contaboClientId,
      client_secret: environment.contaboClientSecret,
      username: environment.contaboApiUser,
      password: environment.contaboApiPassword,
      grant_type: 'password',
    });

    try {
      const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
        this.http.post(url, payload.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }),
      );

      return response.data.access_token;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to fetch access token',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async createServer(dto: CreateServerDto) {
    const { name, password } = dto;
    const url = `${environment.contaboApiUrl}/compute/instances`;

    try {
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
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to create server',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
    return this.getAccessToken();
  }

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

  async updateServerName(serverId: number, name: string) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `${environment.contaboApiUrl}/compute/instances/${serverId}`;
      const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
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
      console.log(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to fetch server list',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async resetServer(serverId: number, dto: ResetServerDto) {
    const { name } = dto;
    const url = `${environment.contaboApiUrl}/compute/instances`;
    const serverCredential = await this.db.serverCredential.findUniqueOrThrow({
      where: { serverId },
    });
    try {
      const accessToken = await this.getAccessToken();
      await this.updateSecretName(serverCredential.secretId, name);
      await this.updateServerName(serverId, name);

      const response: AxiosResponse<Record<string, any>> = await lastValueFrom(
        this.http.put(
          `${url}/${serverId}`,
          {
            imageId: '66abf39a-ba8b-425e-a385-8eb347ceac10',
            rootPassword: serverCredential.secretId,
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

      console.log(response.data.data);
      return response.data;
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to reset server',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async getServerList() {
    const url = `${environment.contaboApiUrl}/compute/instances`;

    try {
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
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to fetch server list',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async connectSsh(serverId: number) {
    const url = `${environment.contaboApiUrl}/compute/instances/${serverId}`;
    const ssh = new NodeSSH();

    try {
      const serverCredential = await this.db.serverCredential.findUniqueOrThrow(
        {
          where: { serverId },
        },
      );

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

      const result = await connection.execCommand('ls -la', { cwd: '/' });

      console.log(result);

      return serverResponse.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to fetch server list',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async getImagesList() {
    const url = `${environment.contaboApiUrl}/compute/images`;

    try {
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

      console.log(response.data);

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new HttpException(
          error.response?.data || 'Failed to fetch images list',
          error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
