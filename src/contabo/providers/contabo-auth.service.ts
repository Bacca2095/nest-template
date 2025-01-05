import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';

import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { environment } from '@/shared/env/environment';

@Injectable()
export class ContaboAuthService {
  constructor(private readonly http: HttpService) {}

  @HandleExceptions()
  async getAccessToken(): Promise<string> {
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
}
