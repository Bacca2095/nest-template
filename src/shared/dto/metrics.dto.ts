import { ApiProperty } from '@nestjs/swagger';

export class MetricsRequestDto {
  @ApiProperty({
    description: 'Type of metric requested (e.g., "cpu", "memory")',
  })
  type: string;

  @ApiProperty({
    description: 'Additional filters or parameters',
    required: false,
  })
  filters?: Record<string, any>;
}

export class MetricsResponseDto {
  @ApiProperty({ description: 'Metric type (e.g., "cpu", "memory")' })
  type: string;

  @ApiProperty({ description: 'Value of the metric' })
  value: number;

  @ApiProperty({ description: 'Timestamp of the metric' })
  timestamp: number;
}
