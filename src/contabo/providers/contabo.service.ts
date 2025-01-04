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

      const update = await connection.execCommand('apt-get update');

      console.log(update);

      const installDependencies = await connection.execCommand(
        'apt-get install ca-certificates curl',
      );

      console.log(installDependencies);

      const setPermissions = await connection.execCommand(
        'install -m 0755 -d /etc/apt/keyrings',
      );

      console.log(setPermissions);

      const addKey = await connection.execCommand(
        'curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc',
      );

      console.log(addKey);

      const chmodKey = await connection.execCommand(
        'chmod a+r /etc/apt/keyrings/docker.asc',
      );

      console.log(chmodKey);

      const addRepo = await connection.execCommand(
        'echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
   tee /etc/apt/sources.list.d/docker.list > /dev/null',
      );

      console.log(addRepo);

      const updateDocker = await connection.execCommand('apt-get update');

      console.log(updateDocker);

      const installDocker = await connection.execCommand(
        'apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin nginx',
      );

      console.log(installDocker);

      const copyFile = await connection.putFile(
        'docker-compose.yml',
        '/root/docker-compose.yml',
      );

      console.log(copyFile);

      const dockerCompose = await connection.execCommand(
        'docker compose up -d',
      );

      console.log(dockerCompose);

      const enableNginx = await connection.execCommand(
        'systemctl enable nginx',
      );
      const startNginx = await connection.execCommand('systemctl start nginx');
      const statusNginx = await connection.execCommand(
        'systemctl status nginx',
      );

      console.log({ enableNginx, startNginx, statusNginx });

      const ufw = await connection.execCommand(
        "ufw allow 'Nginx Full' && ufw reload",
      );

      console.log(ufw);

      const makeDir = await connection.execCommand(
        'sudo mkdir -p /etc/ssl/self-signed',
      );

      console.log(makeDir);

      const generateCert = await connection.execCommand(
        'openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/self-signed/selfsigned.key -out /etc/ssl/self-signed/selfsigned.crt',
      );

      console.log(generateCert);

      const dhparam = await connection.execCommand(
        'openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048',
      );

      console.log(dhparam);

      const copyNginxConfig = await connection.putFile(
        'app',
        '/etc/nginx/sites-available/app',
      );

      console.log(copyNginxConfig);

      const symlink = await connection.execCommand(
        'ln -s /etc/nginx/sites-available/app /etc/nginx/sites-enabled/',
      );

      console.log(symlink);

      const testNginx = await connection.execCommand('nginx -t');

      console.log(testNginx);

      const reloadNginx = await connection.execCommand(
        'systemctl restart nginx',
      );

      console.log(reloadNginx);

      return serverResponse.data;
    } catch (error) {
      console.log(error);
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
