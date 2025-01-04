import { Injectable } from '@nestjs/common';
import * as si from 'systeminformation';

import {
  AppUsageDto,
  BatteryInfoDto,
  CpuMetricsDto,
  DiskIOMetricsDto,
  DiskMetricsDto,
  InternetStatusDto,
  MemoryMetricsDto,
  NetworkInterfaceDto,
  ProcessMetricsDto,
  SystemInfoDto,
  SystemMetricsDto,
  TemperatureInfoDto,
} from '../dto/metrics.dto';

@Injectable()
export class MetricsService {
  private readonly BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'];
  private readonly ROOT_VOLUME = '/System/Volumes/Data';
  private readonly TOP_PROCESS_COUNT = 3;
  private readonly OS = process.platform;

  private formatBytes(bytes: number): string {
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < this.BYTE_UNITS.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(2)} ${this.BYTE_UNITS[unitIndex]}`;
  }

  private formatPercentage(value: number): string {
    return `${value.toFixed(2)}%`;
  }

  private formatHours(seconds: number): string {
    return `${(seconds / 3600).toFixed(2)} hours`;
  }

  async getMemoryUsage(): Promise<MemoryMetricsDto> {
    const [memory, appMemory] = await Promise.all([
      si.mem(),
      process.memoryUsage(),
    ]);

    return {
      total: this.formatBytes(memory.total),
      used: this.formatBytes(memory.used),
      free: this.formatBytes(memory.free),
      usedPercentage: this.formatPercentage((memory.used / memory.total) * 100),
      appUsed: this.formatBytes(appMemory.rss),
    };
  }

  async getCpuUsage(): Promise<CpuMetricsDto> {
    const [cpu, cpuInfo] = await Promise.all([si.currentLoad(), si.cpu()]);

    return {
      currentLoad: this.formatPercentage(cpu.currentLoad),
      cores: cpuInfo.cores,
    };
  }

  async getDiskUsage(): Promise<DiskMetricsDto> {
    const fs = await si.fsSize();

    const rootVolume = fs.find((disk) =>
      this.OS !== 'darwin' ? disk.mount : disk.mount === this.ROOT_VOLUME,
    );

    if (!rootVolume) {
      throw new Error('Root volume not found');
    }

    const { size, used } = rootVolume;
    return {
      mount: rootVolume.mount,
      size: this.formatBytes(size),
      used: this.formatBytes(used),
      available: this.formatBytes(size - used),
      usedPercentage: this.formatPercentage((used / size) * 100),
    };
  }

  async getInternetStatus(): Promise<InternetStatusDto> {
    try {
      const ping = await si.inetLatency();
      return {
        status: 'online',
        latency: `${ping.toFixed(2)} ms`,
      };
    } catch {
      return {
        status: 'offline',
        latency: null,
      };
    }
  }

  async getSystemInfo(): Promise<SystemInfoDto> {
    const [osInfo, uptime] = await Promise.all([
      si.osInfo(),
      Promise.resolve(process.uptime()),
    ]);

    return {
      os: osInfo.distro,
      version: osInfo.release,
      uptime: this.formatHours(uptime),
    };
  }

  async getAppUsage(): Promise<AppUsageDto> {
    const [cpu, appMemory] = await Promise.all([
      si.currentLoad(),
      process.memoryUsage(),
    ]);

    return {
      ram: this.formatBytes(appMemory.rss),
      cpu: this.formatPercentage(cpu.currentLoad),
    };
  }

  async getTopProcesses(): Promise<ProcessMetricsDto> {
    const { list } = await si.processes();

    return {
      topCpuProcesses: list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, this.TOP_PROCESS_COUNT)
        .map(({ name, cpu, pid }) => ({
          name,
          cpu: this.formatPercentage(cpu),
          pid,
        })),
      topMemoryProcesses: list
        .sort((a, b) => b.mem - a.mem)
        .slice(0, this.TOP_PROCESS_COUNT)
        .map(({ name, mem, pid }) => ({
          name,
          memory: this.formatBytes(mem),
          pid,
        })),
    };
  }

  async getActiveNetworkInterface(): Promise<NetworkInterfaceDto | null> {
    const [interfaces, stats] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats(),
    ]);

    const activeStat = stats.find(
      (stat) => stat.rx_bytes > 0 || stat.tx_bytes > 0,
    );

    if (!activeStat) return null;

    const activeInterface = Array.isArray(interfaces)
      ? interfaces.find((iface) => iface.iface === activeStat.iface)
      : interfaces;

    if (!activeInterface) return null;

    return {
      iface: activeInterface.iface,
      ip4: activeInterface.ip4,
      mac: activeInterface.mac,
      speed: activeInterface.speed
        ? `${activeInterface.speed} Mbps`
        : 'Unknown',
      rx: this.formatBytes(activeStat.rx_bytes || 0),
      tx: this.formatBytes(activeStat.tx_bytes || 0),
    };
  }

  async getBatteryInfo(): Promise<BatteryInfoDto> {
    const battery = await si.battery();

    return {
      hasBattery: battery.hasBattery,
      charging: battery.isCharging,
      percentage: battery.percent ? `${battery.percent}%` : 'Unknown',
      timeLeft: battery.timeRemaining
        ? this.formatHours(battery.timeRemaining)
        : 'Unknown',
    };
  }

  async getTemperature(): Promise<TemperatureInfoDto> {
    const temp = await si.cpuTemperature();

    return {
      main: temp.main ? `${temp.main} °C` : 'Unknown',
      cores: temp.cores ? temp.cores.map((t) => `${t} °C`) : [],
      max: temp.max ? `${temp.max} °C` : 'Unknown',
    };
  }

  async getDiskIO(): Promise<DiskIOMetricsDto> {
    const diskIO = await si.disksIO();

    return {
      read: `${(diskIO.rIO / 1024 / 1024).toFixed(2)} MB`,
      write: `${(diskIO.wIO / 1024 / 1024).toFixed(2)} MB`,
    };
  }

  async getAllMetrics(): Promise<SystemMetricsDto> {
    const [
      memory,
      cpu,
      disk,
      internet,
      system,
      appUsage,
      topProcesses,
      networkInterface,
      battery,
      temperature,
      diskIO,
    ] = await Promise.all([
      this.getMemoryUsage(),
      this.getCpuUsage(),
      this.getDiskUsage(),
      this.getInternetStatus(),
      this.getSystemInfo(),
      this.getAppUsage(),
      this.getTopProcesses(),
      this.getActiveNetworkInterface(),
      this.getBatteryInfo(),
      this.getTemperature(),
      this.getDiskIO(),
    ]);

    return {
      memory,
      cpu,
      disk,
      internet,
      system,
      appUsage,
      topProcesses,
      networkInterface,
      battery,
      temperature,
      diskIO,
    };
  }
}
