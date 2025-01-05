import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import { HandleExceptions } from '@/exceptions/decorators/handle-exceptions.decorator';
import { environment } from '@/shared/env/environment';

import { ContaboAuthService } from './contabo-auth.service';

@Injectable()
export class ContaboImageService {
  constructor(
    private readonly http: HttpService,
    private readonly authService: ContaboAuthService,
  ) {}

  @HandleExceptions()
  async getImagesList(): Promise<any> {
    const url = `${environment.contaboApiUrl}/compute/images`;
    const accessToken = await this.authService.getAccessToken();

    const response = await lastValueFrom(
      this.http.get(url, {
        params: { standardImage: true, size: 60, name: 'debian' },
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );

    return response.data;
  }
}
