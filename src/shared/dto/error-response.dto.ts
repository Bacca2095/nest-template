import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    examples: [400, 401, 403, 404, 409, 500],
    description: 'The HTTP status code of the response.',
  })
  statusCode: number;

  @ApiProperty({
    example: '2023-07-21T17:32:28.020Z',
    description: 'The timestamp when the error occurred.',
  })
  timestamp: string;

  @ApiProperty({
    example: '/api/users',
    description: 'The path of the request that caused the error.',
  })
  path: string;

  @ApiProperty({
    example: 'Resource not found',
    description: 'A brief description of the error.',
  })
  message: string;

  @ApiProperty({
    example: 'Not Found',
    description: 'The error type or classification.',
  })
  error: string;

  constructor(partial: Partial<ErrorResponseDto>) {
    Object.assign(this, partial);
  }
}
