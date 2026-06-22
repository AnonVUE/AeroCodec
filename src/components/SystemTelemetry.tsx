import React, { useEffect, useState } from 'react';
import { Cpu, Thermometer, BatteryCharging, ShieldCheck, RefreshCw, BarChart2, Info } from 'lucide-react';
import { EncodingSettings, HardwareTelemetry } from '../types';

interface SystemTelemetryProps {
  settings: EncodingSettings;
  isProcessing: boolean;
  isDarkMode: boolean;
}

export const SystemTelemetry: React.FC<SystemTelemetryProps> = ({
  settings,
  isProcessing,
  isDarkMode,
}) => {
  const [telemetry, setTelemetry] = useState<HardwareTelemetry>({
    cpuUsage: 8,
    coreCount: 8,
    activeCores: [1, 1, 0, 0, 0, 0, 0, 0],
    temperature: 32,
    powerDraw: 0.12,
    fpsMultiplier: 1.0,
    batteryStatus: 'charging',
  });

  // Calculate simulated live Snapdragon core telemetry based on active processing and settings
  useEffect(() => {
    let intervalIdRef: any = null;

    const updateTelemetry = () => {
      setTelemetry((prev) => {
        let baseCpu = 5;
        let tempTarget = 30;
        let wattsTarget = 0.08;
        let pStatus: 'charging' | 'discharging' | 'eco_throttled' = 'charging';

        if (isProcessing) {
          pStatus = settings.performanceMode === 'eco' ? 'eco_throttled' : 'discharging';
          
          if (settings.performanceMode === 'eco') {
            baseCpu = 22 + Math.random() * 5;
            tempTarget = 31 + Math.random() * 1.5;
            wattsTarget = 0.85 + Math.random() * 0.15; // Eco-friendly draw!
          } else if (settings.performanceMode === 'balanced') {
            baseCpu = 48 + Math.random() * 8;
            tempTarget = 35 + Math.random() * 2;
            wattsTarget = 1.95 + Math.random() * 0.35;
          } else {
            // High Perf
            baseCpu = 88 + Math.random() * 8;
            tempTarget = 42 + Math.random() * 3;
            wattsTarget = 3.8 + Math.random() * 0.65; // High power draw!
          }
        } else {
          // Idle state
          baseCpu = 4 + Math.random() * 4;
          tempTarget = 29 + Math.random() * 1;
          wattsTarget = 0.09 + Math.random() * 0.04;
        }

        // Calculate core loads
        const cores = Array(8).fill(0);
        const coresToActivate = isProcessing
          ? settings.performanceMode === 'eco' ? 3 : settings.performanceMode === 'balanced' ? 5 : 8
          : 2;

        for (let i = 0; i < 8; i++) {
          if (i < coresToActivate) {
            cores[i] = Math.round(baseCpu * (0.85 + Math.random() * 0.3));
            if (cores[i] > 100) cores[i] = 100;
          } else {
            cores[i] = Math.round(5 + Math.random() * 4); // idling back cores
          }
        }

        return {
          cpuUsage: Math.round(baseCpu),
          coreCount: 8,
          activeCores: cores,
          temperature: parseFloat(tempTarget.toFixed(1)),
          powerDraw: parseFloat(wattsTarget.toFixed(2)),
          fpsMultiplier: settings.performanceMode === 'eco' ? 0.6 : settings.performanceMode === 'balanced' ? 1.0 : 1.6,
          batteryStatus: pStatus,
        };
      });
    };

    updateTelemetry();
    intervalIdRef = setInterval(updateTelemetry, 1000);

    return () => {
      if (intervalIdRef) clearInterval(intervalIdRef);
    };
  }, [isProcessing, settings.performanceMode]);

  const getTemperatureBadge = (temp: number) => {
    if (temp >= 40) return { label: 'Thermal Warning', style: 'bg-rose-500/15 text-rose-400 border-rose-500/25' };
    if (temp >= 35) return { label: 'Warm (Balanced)', style: 'bg-amber-500/15 text-amber-400 border-amber-500/25' };
    return { label: 'Cool (Eco Safe)', style: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' };
  };

  const tempBadge = getTemperatureBadge(telemetry.temperature);

  return (
    <div className={`space-y-4 font-sans text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Snapdragon Chip Header Card */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-2.5">
        <Cpu className="w-6 h-6 text-indigo-400 shrink-0" />
        <div>
          <h3 className="font-bold text-[13px] tracking-wide text-slate-100 flex items-center gap-1.5 font-sans">
            Snapdragon® 8cx Gen 3 Profile
          </h3>
          <p className="text-[10px] text-slate-400 leading-tight">Hardware Acceleration (AV1/VP9 SOC Decoders)</p>
        </div>
      </div>

      {/* Main Dial meters */}
      <div className="grid grid-cols-3 gap-2">
        
        {/* Core Usage */}
        <div className={`p-2.5 rounded border ${isDarkMode ? 'bg-slate-900/35 border-white/5' : 'bg-white/45 border-slate-900/10'} text-center shadow-sm`}>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">CPU Load</span>
          <div className="text-[18px] font-mono font-extrabold text-blue-400">
            {telemetry.cpuUsage}%
          </div>
          <div className="w-full bg-slate-950/40 h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-blue-400 h-full transition-all duration-300"
              style={{ width: `${telemetry.cpuUsage}%` }}
            />
          </div>
        </div>

        {/* Temperature */}
        <div className={`p-2.5 rounded border ${isDarkMode ? 'bg-slate-900/35 border-white/5' : 'bg-white/45 border-slate-900/10'} text-center shadow-sm`}>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">SoC Temp</span>
          <div className={`text-[18px] font-mono font-extrabold flex items-center justify-center gap-0.5
            ${telemetry.temperature >= 40 ? 'text-rose-400' : telemetry.temperature >= 35 ? 'text-amber-400' : 'text-emerald-400'}
          `}>
            <Thermometer className="w-4 h-4 shrink-0" /> {telemetry.temperature}°C
          </div>
          <div className="w-full bg-slate-950/40 h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300
                ${telemetry.temperature >= 40 ? 'bg-rose-400' : telemetry.temperature >= 35 ? 'bg-amber-400' : 'bg-emerald-400'}
              `}
              style={{ width: `${Math.min(100, Math.max(0, (telemetry.temperature / 60) * 100))}%` }}
            />
          </div>
        </div>

        {/* Dynamic Power Drawn (Simulated mW) */}
        <div className={`p-2.5 rounded border ${isDarkMode ? 'bg-slate-900/35 border-white/5' : 'bg-white/45 border-slate-900/10'} text-center shadow-sm`}>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-0.5">Power Draw</span>
          <div className="text-[18px] font-mono font-extrabold text-purple-400">
            {telemetry.powerDraw >= 1.0 ? `${telemetry.powerDraw.toFixed(1)}W` : `${Math.round(telemetry.powerDraw * 1000)}mW`}
          </div>
          <div className="w-full bg-slate-950/40 h-1 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-purple-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (telemetry.powerDraw / 4.5) * 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* Kryo Core Thread Bars */}
      <div className={`p-3 rounded-md border ${isDarkMode ? 'bg-slate-900/20 border-white/5' : 'bg-white/45 border-slate-900/10'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-[10px] uppercase text-sky-400 tracking-wider flex items-center gap-1">
            <BarChart2 className="w-3.5 h-3.5" /> Kryo™ Core-Specific Thread Loading
          </span>
          <span className="text-[9px] text-slate-400 font-mono">8 Threads</span>
        </div>
        
        {/* Core grid representation */}
        <div className="grid grid-cols-4 gap-1.5">
          {telemetry.activeCores.map((load, index) => {
            const isPerfCore = index >= 4;
            return (
              <div 
                key={index} 
                className={`p-1.5 rounded bg-slate-950/40 border border-white/5 flex flex-col justify-between text-center`}
                title={`${isPerfCore ? 'Performance Core' : 'Efficiency Core'} Load: ${load}%`}
              >
                <span className="text-[8px] font-mono text-slate-500">Core {index}</span>
                <span className={`text-[10.5px] font-mono font-bold ${load > 70 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {load}%
                </span>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                  <div 
                    className={`h-full ${isPerfCore ? 'bg-amber-400' : 'bg-sky-400'}`}
                    style={{ width: `${load}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[8.5px] text-slate-400 font-medium mt-2">
          <div className="flex items-center gap-1">
            <div className="w-2-h-2 h-1.5 w-1.5 rounded-full bg-sky-400" />
            <span>Efficiency Cores (0-3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2-h-2 h-1.5 w-1.5 rounded-full bg-amber-400" />
            <span>Kryo Gold Cores (4-7)</span>
          </div>
        </div>
      </div>

      {/* Eco Savings Stat block */}
      <div className={`p-3 rounded-md border ${tempBadge.style} flex flex-col justify-between space-y-1.5`}>
        <div className="flex items-center justify-between">
          <span className="font-bold uppercase text-[9.5px]">Thermal Assessment</span>
          <span className="text-[8.5px] opacity-75 font-mono">{tempBadge.label}</span>
        </div>
        
        {settings.performanceMode === 'eco' ? (
          <div className="text-[10.5px] leading-relaxed opacity-90 text-emerald-400 select-none">
            <div className="flex items-center gap-1 font-semibold text-[11px] mb-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Eco Throttle Engine Active!
            </div>
            Applying active frame cycle skipping. SOC voltage frequency dropped to 1.1 GHz to protect older snapdragon batteries. Estimated thermal output reduced by 40%.
          </div>
        ) : (
          <div className="text-[10.5px] leading-relaxed opacity-85 text-slate-300">
            {settings.performanceMode === 'high_perf' 
              ? 'Performance mode overrides safety limits! High thread dispatch can lead to thermal pacing after prolonged batch cycles.'
              : 'Cooling profile is optimal. Balance between thread speeds and power is maintained.'
            }
          </div>
        )}
      </div>

      {/* Snapdragon benchmark profile ratings */}
      <div className="p-3 bg-slate-950/30 rounded border border-white/5 space-y-1 text-[10px] text-slate-400 font-sans leading-relaxed">
        <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-0.5 text-[10.5px]">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> Snapdragon Battery Run Time Estimate
        </div>
        {settings.performanceMode === 'eco' && (
          <p className="text-emerald-400 font-medium">✓ Eco render adds ~1.8 - 2.5 hours of additional runtime when encoding on the go!</p>
        )}
        {settings.performanceMode === 'balanced' && (
          <p className="text-amber-400 font-medium">✓ Balanced render preserves normal battery rates. Safe for general mobile transcoding.</p>
        )}
        {settings.performanceMode === 'high_perf' && (
          <p className="text-rose-400 font-medium">⚠ Warning: High Speed triggers peak power cycles (~3.6W). Connect charger to avoid drainage.</p>
        )}
      </div>

    </div>
  );
};
