import { AppErrorCodesEnum } from '../enums/app-error-codes.enum';

export class AppError extends Error {
  code: AppErrorCodesEnum;
  constructor(errorCode: AppErrorCodesEnum) {
    super(errorCode);
    this.code = errorCode;
  }
}
