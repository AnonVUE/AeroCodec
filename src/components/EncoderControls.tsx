import React, { useEffect, useState } from 'react';
import { Cpu, HelpCircle, HardDrive, Zap, Info, ShieldAlert } from 'lucide-react';
import { EncodingSettings, CodecType } from '../types';

interface EncoderControlsProps {
  settings: EncodingSettings;
  onChange: (settings: EncodingSettings) => void;
  isDarkMode: boolean;
}

export const EncoderControls: React.FC<EncoderControlsProps> = ({
  settings,
  onChange,
  isDarkMode,
}) => {
  const [hardwareScore, setHardwareScore] = useState<{
    cores: number;
    memory: string;
    speedEstimate: string;
    tier: 'Low' | 'Medium' | 'High';
    recommendedCodec: CodecType;
    recommendedResolution: string;
  }>({
    cores: 4,
    memory: '4GB',
    speedEstimate: 'Measuring...',
    tier: 'Medium',
    recommendedCodec: 'VP9',
    recommendedResolution: '1280x720',
  });

  const [customWidth, setCustomWidth] = useState<string>('1920');
  const [customHeight, setCustomHeight] = useState<string>('1080');

  // Perform client-side physical hardware estimation for the Auto Profile Coach!
  useEffect(() => {
    const runHardwareAeroScan = () => {
      const cores = navigator.hardwareConcurrency || 4;
      // Estimate memory if supported, fallback to simulated 6GB
      const ram = (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : '6 GB';
      
      // Perform a tiny computational stress test (20ms array loops) to calculate mock speed
      const start = performance.now();
      let dummyVal = 0;
      for (let i = 0; i < 5000000; i++) {
        dummyVal += Math.sqrt(i) * Math.sin(i);
      }
      const end = performance.now();
      const testDurationMs = end - start;
      
      let speedEstimate = '';
      let tier: 'Low' | 'Medium' | 'High' = 'Medium';
      let recommendedCodec: CodecType = 'VP9';
      let recommendedResolution = '1280x720';

      if (testDurationMs < 75 && cores >= 6) {
        speedEstimate = 'Ultra-efficient (Snapdragon Elite Flagship Class)';
        tier = 'High';
        recommendedCodec = 'AV1'; // AV1 excels on high performance newer chips
        recommendedResolution = '1920x1080';
      } else if (testDurationMs < 150 && cores >= 4) {
        speedEstimate = 'Power Balanced (Snapdragon Tier 2/3)';
        tier = 'Medium';
        recommendedCodec = 'VP9'; // Great compatibility and hardware acceleration
        recommendedResolution = '1280x720';
      } else {
        speedEstimate = 'Thermal Saving (Older Snapdragon Hardware)';
        tier = 'Low';
        recommendedCodec = 'VP8'; // Very lightweight and easy to render
        recommendedResolution = '640x480';
      }

      setHardwareScore({
        cores,
        memory: ram,
        speedEstimate,
        tier,
        recommendedCodec,
        recommendedResolution,
      });

      // If Auto Mode is checked, override current settings with custom recommended optimal profile
      if (settings.autoMode) {
        const [recW, recH] = recommendedResolution.split('x').map(Number);
        onChange({
          ...settings,
          codec: recommendedCodec,
          resolution: {
            width: recW,
            height: recH,
            custom: false,
          },
          bitrate: tier === 'High' ? 4500 : tier === 'Medium' ? 2500 : 1200,
          performanceMode: tier === 'High' ? 'high_perf' : tier === 'Medium' ? 'balanced' : 'eco',
        });
      }
    };

    runHardwareAeroScan();
  }, [settings.autoMode]);

  const handleCodecChange = (codec: CodecType) => {
    if (settings.autoMode) return;
    onChange({ ...settings, codec });
  };

  const handleResolutionPresetChange = (preset: string) => {
    if (settings.autoMode) return;
    
    if (preset === 'custom') {
      onChange({
        ...settings,
        resolution: {
          width: parseInt(customWidth) || 1920,
          height: parseInt(customHeight) || 1080,
          custom: true,
        },
      });
    } else {
      const [w, h] = preset.split('x').map(Number);
      onChange({
        ...settings,
        resolution: {
          width: w,
          height: h,
          custom: false,
        },
      });
    }
  };

  const handleCustomDimensionChange = (w: string, h: string) => {
    setCustomWidth(w);
    setCustomHeight(h);
    const parsedW = parseInt(w) || 1920;
    const parsedH = parseInt(h) || 1080;
    onChange({
      ...settings,
      resolution: {
        width: parsedW,
        height: parsedH,
        custom: true,
      },
    });
  };

  const handleBitrateSlider = (val: number) => {
    if (settings.autoMode) return;
    onChange({ ...settings, bitrate: val });
  };

  const toggleAutoMode = () => {
    onChange({ ...settings, autoMode: !settings.autoMode });
  };

  return (
    <div className={`space-y-4 font-sans text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Target Codec Selection */}
      <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-slate-900/30 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner`}>
        <div className="flex items-center justify-between mb-2">
          <label className="font-semibold flex items-center gap-1.5 uppercase tracking-wide text-xs">
            <Cpu className="w-4 h-4 text-sky-400" /> Output Encoding Format
          </label>
          {settings.autoMode && <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-semibold animate-pulse">Auto Managed</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(['AV1', 'VP9', 'VP8'] as CodecType[]).map((c) => {
            const isSelected = settings.codec === c;
            return (
              <button
                key={c}
                id={`codec-select-${c}`}
                disabled={settings.autoMode}
                onClick={() => handleCodecChange(c)}
                className={`
                  p-2 rounded text-left border transition-all relative overflow-hidden
                  ${isSelected 
                    ? 'bg-sky-500/15 border-sky-400 font-bold text-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.15)]' 
                    : 'border-white/5 hover:bg-white/10 text-slate-400'
                  }
                  ${settings.autoMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-[14px]">{c}</div>
                <div className="text-[10px] opacity-75 font-normal">
                  {c === 'AV1' && 'Next-Gen (Best Size)'}
                  {c === 'VP9' && 'Full Core Accel'}
                  {c === 'VP8' && 'Direct Legacy compatibility'}
                </div>
                {isSelected && (
                  <div className="absolute right-1 top-1 w-2 h-2 rounded-full bg-sky-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Target Resolution Scaling */}
      <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-slate-900/30 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner`}>
        <label className="font-semibold flex items-center gap-1.5 uppercase tracking-wide text-xs mb-2">
          <HardDrive className="w-4 h-4 text-emerald-400" /> Target Scaling Resolution
        </label>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select
            id="resolution-preset-select"
            value={settings.resolution.custom ? 'custom' : `${settings.resolution.width}x${settings.resolution.height}`}
            onChange={(e) => handleResolutionPresetChange(e.target.value)}
            disabled={settings.autoMode}
            className={`
              p-2 rounded border bg-slate-950/40 text-slate-300 font-sans text-xs focus:ring-1 focus:ring-sky-400 outline-none
              ${settings.autoMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <option className="bg-slate-900" value="1920x1080">1080p FHD (1920 x 1080)</option>
            <option className="bg-slate-900" value="1280x720">720p HD (1280 x 720)</option>
            <option className="bg-slate-900" value="854x480">480p SD (854 x 480)</option>
            <option className="bg-slate-900" value="640x360">360p (640 x 360)</option>
            <option className="bg-slate-900" value="custom">Custom Dimensions...</option>
          </select>

          <div className="text-right flex items-center justify-end pr-1 text-slate-400 font-mono text-[13px] font-semibold">
            {settings.resolution.width} × {settings.resolution.height}
          </div>
        </div>

        {/* Custom Width / Height Inputs if custom preset selected */}
        {settings.resolution.custom && !settings.autoMode && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
            <div>
              <span className="text-[10px] text-slate-400">Width (pixels)</span>
              <input
                type="number"
                id="custom-width-input"
                value={customWidth}
                onChange={(e) => handleCustomDimensionChange(e.target.value, customHeight)}
                className="w-full p-1.5 rounded border border-white/10 bg-slate-950/40 text-slate-300 font-mono text-xs outline-none"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Height (pixels)</span>
              <input
                type="number"
                id="custom-height-input"
                value={customHeight}
                onChange={(e) => handleCustomDimensionChange(customWidth, e.target.value)}
                className="w-full p-1.5 rounded border border-white/10 bg-slate-950/40 text-slate-300 font-mono text-xs outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bitrate Configuration */}
      <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-slate-900/30 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner`}>
        <div className="flex items-center justify-between mb-1">
          <label className="font-semibold flex items-center gap-1.5 uppercase tracking-wide text-xs">
            <Zap className="w-4 h-4 text-yellow-400" /> Target Bitrate Speed
          </label>
          <span className="font-mono text-xs text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
            {settings.bitrate >= 1000 ? `${(settings.bitrate / 1000).toFixed(1)} Mbps` : `${settings.bitrate} kbps`}
          </span>
        </div>
        <p className="text-[10.5px] text-slate-400 mb-2">Controls stream quality depth density. Higher values generate crisp files.</p>
        <input
          type="range"
          id="bitrate-range"
          min="250"
          max="12000"
          step="250"
          value={settings.bitrate}
          disabled={settings.autoMode}
          onChange={(e) => handleBitrateSlider(parseInt(e.target.value))}
          className={`w-full py-2 accent-sky-400 bg-slate-950/10 ${settings.autoMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>250 kbps (SD)</span>
          <span>5 Mbps (FHD)</span>
          <span>12 Mbps (High)</span>
        </div>
      </div>

      {/* Snapdragon Coprocessor Rendering Preset */}
      <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-slate-900/30 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner`}>
        <label className="font-semibold flex items-center gap-1.5 uppercase tracking-wide text-xs mb-1.5">
          <Info className="w-4 h-4 text-purple-400" /> Snapdragon Battery Optimizer
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {([
            { id: 'eco', label: 'Eco-Throttle', desc: 'Drops UI frame renders to reduce SoC heat' },
            { id: 'balanced', label: 'Balanced', desc: 'Smooth performance & CPU throttle limit' },
            { id: 'high_perf', label: 'High Speed', desc: 'Full active thread pooling render' },
          ] as const).map((mode) => {
            const isSelected = settings.performanceMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`perf-mode-${mode.id}`}
                disabled={settings.autoMode}
                onClick={() => onChange({ ...settings, performanceMode: mode.id })}
                className={`
                  p-1.5 rounded transition-all text-left border flex flex-col justify-between h-14
                  ${isSelected 
                    ? 'bg-purple-500/15 border-purple-400 text-purple-400 font-semibold' 
                    : 'border-white/5 bg-slate-900/10 text-slate-400'
                  }
                  ${settings.autoMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={mode.desc}
              >
                <span className="text-[10px] uppercase font-bold">{mode.label}</span>
                <span className="text-[8.5px] opacity-75 font-normal leading-tight line-clamp-2">{mode.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Snapdragon Hardware / Bandwidth Auto Profiler (The requested Auto Mode) */}
      <div className={`p-3.5 rounded-md border ${settings.autoMode ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-900/20 border-white/5'}`}>
        <div className="flex items-center justify-between pointer-events-auto">
          <div>
            <h4 className="font-semibold text-xs text-sky-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-emerald-400" /> Qualcomm Snapdragon Coach
            </h4>
            <p className="text-[10px] text-slate-400">Intelligent hardware codec & bottleneck scanner.</p>
          </div>
          <button
            onClick={toggleAutoMode}
            id="coach-auto-mode-toggle"
            className={`
              aero-button px-3.5 py-1 text-xs select-none
              ${settings.autoMode 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600 font-bold' 
                : 'aero-button-aqua text-blue-900'
              }
            `}
          >
            {settings.autoMode ? 'Auto: Active' : 'Enable Auto'}
          </button>
        </div>

        {/* Telemetry output box in Auto config */}
        {settings.autoMode && (
          <div className="mt-3 p-2.5 rounded bg-emerald-950/20 border border-emerald-900/20 text-[11px] font-sans font-medium space-y-1 text-emerald-300">
            <div className="flex justify-between">
              <span>Estimated SOC Power:</span>
              <span className="font-mono text-white font-semibold">{hardwareScore.speedEstimate}</span>
            </div>
            <div className="flex justify-between">
              <span>Logical CPU Processors:</span>
              <span className="font-mono text-white font-semibold">{hardwareScore.cores} Cores</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated bandwidth cap:</span>
              <span className="font-mono text-white font-semibold">Unlimited (Offline/Local)</span>
            </div>
            <div className="flex justify-between text-yellow-400 border-t border-emerald-500/20 pt-1.5 mt-1.5 select-none text-[11.5px] items-center">
              <span>Optimized Target Profile:</span>
              <span className="font-mono font-bold uppercase bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20">
                {hardwareScore.recommendedCodec} ({hardwareScore.recommendedResolution})
              </span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
