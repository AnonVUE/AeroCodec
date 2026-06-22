export type CodecType = 'AV1' | 'VP9' | 'VP8';

export interface ResolutionOption {
  label: string;
  width: number;
  height: number;
}

export interface EncodingSettings {
  codec: CodecType;
  resolution: {
    width: number;
    height: number;
    custom: boolean;
  };
  bitrate: number; // in kbps
  audioBitrate: number; // in kbps
  performanceMode: 'eco' | 'balanced' | 'high_perf'; // Snapdragon optimization presets
  autoMode: boolean; // Auto codec/bitrate based on device scan
}

export interface VideoFile {
  id: string;
  name: string;
  fileSize: number; // in bytes
  duration: number; // in seconds
  width: number;
  height: number;
  status: 'queued' | 'processing' | 'completed' | 'cancelled';
  progress: number;
  elapsedTime: number; // in seconds
  estimatedRemainingTime: number; // in seconds
  targetCodec: CodecType;
  targetWidth: number;
  targetHeight: number;
  targetBitrate: number; // kbps
  actualFps: number;
  outputSize?: number; // in bytes
  objectUrl: string; // original object url
}

export interface HardwareTelemetry {
  cpuUsage: number; // percentage
  coreCount: number;
  activeCores: number[];
  temperature: number; // °C
  powerDraw: number; // Watts
  fpsMultiplier: number;
  batteryStatus: 'charging' | 'discharging' | 'eco_throttled';
}

export interface VirtualFolder {
  id: string;
  name: string;
  path: string;
  files: {
    name: string;
    size: number;
    createdAt: string;
    codec: CodecType;
    resolution: string;
  }[];
}
