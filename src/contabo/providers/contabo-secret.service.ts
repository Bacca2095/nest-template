import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { v4 } from 'uuid';

import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { environment } from '@/shared/env/environment';

import { ContaboAuthService } from './contabo-auth.service';

@Injectable()
export class ContaboSecretService {
  constructor(
    private readonly http: HttpService,
    private readonly authService: ContaboAuthService,
  ) {}

  @HandleExceptions()
  async createSecret(password: string, name: string): Promise<number> {
    const accessToken = await this.authService.getAccessToken();
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
  async updateSecretName(secretId: number, name: string): Promise<void> {
    const accessToken = await this.authService.getAccessToken();
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
}
