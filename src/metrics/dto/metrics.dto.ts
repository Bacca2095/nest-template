import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class MemoryMetricsDto {
  @ApiProperty({ example: '16 GB' })
  @IsString()
  total: string;

  @ApiProperty({ example: '8 GB' })
  @IsString()
  used: string;

  @ApiProperty({ example: '8 GB' })
  @IsString()
  free: string;

  @ApiProperty({ example: '50%' })
  @IsString()
  usedPercentage: string;

  @ApiProperty({ example: '200 MB' })
  @IsString()
  appUsed: string;
}

export class CpuMetricsDto {
  @ApiProperty({ example: '45%' })
  @IsString()
  currentLoad: string;

  @ApiProperty({ example: 8 })
  @IsNumber()
  cores: number;
}

export class DiskMetricsDto {
  @ApiProperty({ example: '/System/Volumes/Data' })
  @IsString()
  mount: string;

  @ApiProperty({ example: '500 GB' })
  @IsString()
  size: string;

  @ApiProperty({ example: '250 GB' })
  @IsString()
  used: string;

  @ApiProperty({ example: '250 GB' })
  @IsString()
  available: string;

  @ApiProperty({ example: '50%' })
  @IsString()
  usedPercentage: string;
}

export class InternetStatusDto {
  @ApiProperty({ enum: ['online', 'offline'] })
  @IsEnum(['online', 'offline'])
  status: 'online' | 'offline';

  @ApiProperty({ example: '50 ms', nullable: true })
  @IsString()
  @IsOptional()
  latency: string | null;
}

export class SystemInfoDto {
  @ApiProperty({ example: 'macOS' })
  @IsString()
  os: string;

  @ApiProperty({ example: '13.0.0' })
  @IsString()
  version: string;

  @ApiProperty({ example: '24.5 hours' })
  @IsString()
  uptime: string;
}

export class AppUsageDto {
  @ApiProperty({ example: '200 MB' })
  @IsString()
  ram: string;

  @ApiProperty({ example: '5%' })
  @IsString()
  cpu: string;
}

export class ProcessInfoDto {
  @ApiProperty({ example: 'chrome' })
  @IsString()
  name: string;

  @ApiProperty({ example: 1234 })
  @IsNumber()
  pid: number;
}

export class CpuProcessDto extends ProcessInfoDto {
  @ApiProperty({ example: '10%' })
  @IsString()
  cpu: string;
}

export class MemoryProcessDto extends ProcessInfoDto {
  @ApiProperty({ example: '500 MB' })
  @IsString()
  memory: string;
}

export class ProcessMetricsDto {
  @ApiProperty({ type: [CpuProcessDto] })
  @ValidateNested({ each: true })
  @Type(() => CpuProcessDto)
  @IsArray()
  topCpuProcesses: CpuProcessDto[];

  @ApiProperty({ type: [MemoryProcessDto] })
  @ValidateNested({ each: true })
  @Type(() => MemoryProcessDto)
  @IsArray()
  topMemoryProcesses: MemoryProcessDto[];
}

export class NetworkInterfaceDto {
  @ApiProperty({ example: 'en0' })
  @IsString()
  iface: string;

  @ApiProperty({ example: '192.168.1.1' })
  @IsString()
  ip4: string;

  @ApiProperty({ example: '00:00:00:00:00:00' })
  @IsString()
  mac: string;

  @ApiProperty({ example: '1000 Mbps' })
  @IsString()
  speed: string;

  @ApiProperty({ example: '1.5 GB' })
  @IsString()
  rx: string;

  @ApiProperty({ example: '500 MB' })
  @IsString()
  tx: string;
}

export class BatteryInfoDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  hasBattery: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  charging: boolean;

  @ApiProperty({ example: '75%' })
  @IsString()
  percentage: string;

  @ApiProperty({ example: '2.5 hours' })
  @IsString()
  timeLeft: string;
}

export class TemperatureInfoDto {
  @ApiProperty({ example: '45 °C' })
  @IsString()
  main: string;

  @ApiProperty({ type: [String], example: ['40 °C', '42 °C'] })
  @IsArray()
  @IsString({ each: true })
  cores: string[];

  @ApiProperty({ example: '50 °C' })
  @IsString()
  max: string;
}

export class DiskIOMetricsDto {
  @ApiProperty({ example: '100 MB' })
  @IsString()
  read: string;

  @ApiProperty({ example: '50 MB' })
  @IsString()
  write: string;
}

export class SystemMetricsDto {
  @ApiProperty({ type: MemoryMetricsDto })
  @ValidateNested()
  @Type(() => MemoryMetricsDto)
  memory: MemoryMetricsDto;

  @ApiProperty({ type: CpuMetricsDto })
  @ValidateNested()
  @Type(() => CpuMetricsDto)
  cpu: CpuMetricsDto;

  @ApiProperty({ type: DiskMetricsDto })
  @ValidateNested()
  @Type(() => DiskMetricsDto)
  disk: DiskMetricsDto;

  @ApiProperty({ type: InternetStatusDto })
  @ValidateNested()
  @Type(() => InternetStatusDto)
  internet: InternetStatusDto;

  @ApiProperty({ type: SystemInfoDto })
  @ValidateNested()
  @Type(() => SystemInfoDto)
  system: SystemInfoDto;

  @ApiProperty({ type: AppUsageDto })
  @ValidateNested()
  @Type(() => AppUsageDto)
  appUsage: AppUsageDto;

  @ApiProperty({ type: ProcessMetricsDto })
  @ValidateNested()
  @Type(() => ProcessMetricsDto)
  topProcesses: ProcessMetricsDto;

  @ApiProperty({ type: NetworkInterfaceDto, nullable: true })
  @ValidateNested()
  @Type(() => NetworkInterfaceDto)
  @IsOptional()
  networkInterface: NetworkInterfaceDto | null;

  @ApiProperty({ type: BatteryInfoDto })
  @ValidateNested()
  @Type(() => BatteryInfoDto)
  battery: BatteryInfoDto;

  @ApiProperty({ type: TemperatureInfoDto })
  @ValidateNested()
  @Type(() => TemperatureInfoDto)
  temperature: TemperatureInfoDto;

  @ApiProperty({ type: DiskIOMetricsDto })
  @ValidateNested()
  @Type(() => DiskIOMetricsDto)
  diskIO: DiskIOMetricsDto;
}
