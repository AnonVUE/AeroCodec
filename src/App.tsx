import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Cpu, 
  FolderOpen, 
  Film, 
  FolderHeart, 
  Layout, 
  Settings2, 
  Moon, 
  Sun, 
  Play, 
  Heart, 
  Clock, 
  User, 
  Flame, 
  HardDrive,
  CheckCircle2, 
  Maximize2,
  Minimize2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { AeroWindow } from './components/AeroWindow';
import { EncoderControls } from './components/EncoderControls';
import { VisualPreview } from './components/VisualPreview';
import { SystemTelemetry } from './components/SystemTelemetry';
import { VirtualFileSystem } from './components/VirtualFileSystem';
import { BatchQueue } from './components/BatchQueue';
import { EncodingSettings, VideoFile, VirtualFolder } from './types';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string>('transcoder');
  const [timeText, setTimeText] = useState<string>('');
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
  
  // Custom File export destination path
  const [exportPath, setExportPath] = useState<string>('C:\\Windows\\AeroTranscodes\\Output');
  const [activeFolderId, setActiveFolderId] = useState<string>('output');

  // Virtual file systems explorer nodes
  const [folders, setFolders] = useState<VirtualFolder[]>([
    {
      id: 'output',
      name: 'Output',
      path: 'C:\\Windows\\AeroTranscodes\\Output',
      files: [
        { name: 'retro_matrix_vp8.webm', size: 4529000, createdAt: '2026-06-22', codec: 'VP8', resolution: '1280x720' },
        { name: 'snapdragon_test_av1.webm', size: 2840000, createdAt: '2026-06-22', codec: 'AV1', resolution: '1920x1080' }
      ]
    },
    {
      id: 'archive',
      name: 'Archive',
      path: 'C:\\Windows\\AeroTranscodes\\Archive',
      files: []
    },
    {
      id: 'renders',
      name: 'Renders',
      path: 'C:\\Windows\\AeroTranscodes\\Renders',
      files: []
    }
  ]);

  // Transcoder main configuration state
  const [settings, setSettings] = useState<EncodingSettings>({
    codec: 'VP9',
    resolution: {
      width: 1280,
      height: 720,
      custom: false,
    },
    bitrate: 2500,
    audioBitrate: 192,
    performanceMode: 'balanced',
    autoMode: false,
  });

  // Batch queue state vector
  const [queue, setQueue] = useState<VideoFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState<number>(-1);
  const transcodeIntervalRef = useRef<any>(null);
  const processedFramesRef = useRef<number>(0);

  // Live elapsed ticker
  const [offlineStatus, setOfflineStatus] = useState(true);

  // Set real clock updates for Aero Sidebar gadgets
  useEffect(() => {
    const tickTime = () => {
      const now = new Date();
      setTimeText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tickTime();
    const intervalId = setInterval(tickTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Multi-threaded sequential Transcoder loop
  useEffect(() => {
    if (!isProcessing) {
      if (transcodeIntervalRef.current) {
        clearInterval(transcodeIntervalRef.current);
        transcodeIntervalRef.current = null;
      }
      return;
    }

    const startNextTranscodeSlot = () => {
      // Find direct index of next queued video
      const nextIdx = queue.findIndex((item) => item.status === 'queued' || item.status === 'processing');
      if (nextIdx === -1) {
        setIsProcessing(false);
        setProcessingIndex(-1);
        alert('All items in the batch queue have finished encoding successfully! Files saved to export partition C:');
        return;
      }

      setProcessingIndex(nextIdx);
      processedFramesRef.current = 0;

      // Update item status to active processing
      setQueue((prevQueue) =>
        prevQueue.map((item, id) => {
          if (id === nextIdx) {
            return {
              ...item,
              status: 'processing',
              targetCodec: settings.codec,
              targetWidth: settings.resolution.width,
              targetHeight: settings.resolution.height,
              targetBitrate: settings.bitrate,
            };
          }
          return item;
        })
      );
    };

    if (processingIndex === -1) {
      startNextTranscodeSlot();
    } else {
      const activeItem = queue[processingIndex];
      if (!activeItem) return;

      // Compute physical variables for live speed dials
      const baseFps = 32;
      const perfMultiplier = settings.performanceMode === 'eco' ? 0.55 : settings.performanceMode === 'balanced' ? 1.0 : 1.75;
      const codecMultiplier = settings.codec === 'AV1' ? 0.65 : settings.codec === 'VP9' ? 1.0 : 1.35;
      const resMultiplier = 
        settings.resolution.width >= 1920 ? 0.55 :
        settings.resolution.width >= 1280 ? 0.9 :
        settings.resolution.width >= 854 ? 1.3 : 1.7;

      const dynamicFps = Math.max(1, Math.round(baseFps * perfMultiplier * codecMultiplier * resMultiplier));
      const totalFramesNeeded = activeItem.duration * 30; // 30fps target duration

      // Live loop tick: Every 250ms
      transcodeIntervalRef.current = setInterval(() => {
        processedFramesRef.current += Math.ceil(dynamicFps / 4);

        if (processedFramesRef.current >= totalFramesNeeded) {
          processedFramesRef.current = totalFramesNeeded;
          clearInterval(transcodeIntervalRef.current);

          // Calculate approximate resulting file size based on compression and bitrate target
          // Formula: (targetBitrate * duration in seconds) / 8 (bits to bytes) + audio packet sizes
          const rawCalculatedSize = Math.round(((settings.bitrate * activeItem.duration) / 8) * 1024);
          // Scale compression savings based on codec selection
          const codecCompressFactor = settings.codec === 'AV1' ? 0.72 : settings.codec === 'VP9' ? 0.88 : 1.05;
          const outputByteSize = Math.round(rawCalculatedSize * codecCompressFactor);

          // Marks current completed
          setQueue((prevQueue) =>
            prevQueue.map((item, idx) => {
              if (idx === processingIndex) {
                return {
                  ...item,
                  status: 'completed',
                  progress: 100,
                  actualFps: dynamicFps,
                  outputSize: outputByteSize,
                };
              }
              return item;
            })
          );

          // Export completed file representation into active virtual file Explorer partition
          const plainFileName = activeItem.name.replace(/\.\w+$/, '');
          const extension = settings.codec === 'AV1' ? 'webm' : settings.codec === 'VP9' ? 'webm' : 'webm';
          const finalEncodedFileName = `${plainFileName}_encoded_${settings.codec.toLowerCase()}_${settings.resolution.width}p.${extension}`;

          setFolders((prevFolders) =>
            prevFolders.map((fold) => {
              if (fold.id === activeFolderId) {
                // Safeguard against duplicate names in file list
                if (fold.files.some((f) => f.name === finalEncodedFileName)) {
                  return fold;
                }
                return {
                  ...fold,
                  files: [
                    ...fold.files,
                    {
                      name: finalEncodedFileName,
                      size: outputByteSize,
                      createdAt: new Date().toISOString().split('T')[0],
                      codec: settings.codec,
                      resolution: `${settings.resolution.width}x${settings.resolution.height}`,
                    },
                  ],
                };
              }
              return fold;
            })
          );

          // Prepare slot trigger for next item in batch queue
          setProcessingIndex(-1);
        } else {
          // Normal progressive updates
          const progressMultiplierPercentage = Math.round((processedFramesRef.current / totalFramesNeeded) * 100);
          const elapsedSecondsComp = Math.round(processedFramesRef.current / dynamicFps);
          const remainingSecondsComp = Math.max(0, Math.ceil((totalFramesNeeded - processedFramesRef.current) / dynamicFps));

          setQueue((prevQueue) =>
            prevQueue.map((item, idx) => {
              if (idx === processingIndex) {
                return {
                  ...item,
                  progress: progressMultiplierPercentage,
                  actualFps: dynamicFps,
                  elapsedTime: elapsedSecondsComp,
                  estimatedRemainingTime: remainingSecondsComp,
                };
              }
              return item;
            })
          );
        }
      }, 250);
    }

    return () => {
      if (transcodeIntervalRef.current) {
        clearInterval(transcodeIntervalRef.current);
      }
    };
  }, [isProcessing, processingIndex, queue.length, settings]);

  const handleStartTranscodeBatch = () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    setProcessingIndex(-1);
  };

  const handleCancelTranscodeBatch = () => {
    setIsProcessing(false);
    setProcessingIndex(-1);
    setQueue((prevQueue) =>
      prevQueue.map((item) => {
        if (item.status === 'processing') {
          return { ...item, status: 'cancelled' };
        }
        return item;
      })
    );
  };

  // Safe active file finder for rendering preview feeds
  const activeVideoFile = processingIndex !== -1 ? queue[processingIndex] : (queue.length > 0 ? queue[0] : null);

  return (
    <div className={`w-full min-h-screen relative flex flex-col p-4 overflow-x-hidden transition-all duration-300 select-none
      ${isDarkMode ? 'aero-aurora-bg-dark' : 'aero-aurora-bg'}
    `}>
      
      {/* Top Aero Navigation Header menu bar with dark mode toggle */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between pb-4 border-b border-white/10 mb-5 relative z-40 select-none">
        
        {/* Logo and App Status */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-lg border border-white/30 bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] aero-shine">
            <Tv className="w-5 h-5" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.5)] flex items-center gap-2">
              Aero Video Transcoder v2.0
            </h1>
            <p className="text-[10.5px] text-sky-200/90 font-medium tracking-wide flex items-center gap-1.5 leading-none mt-0.5">
              <span>● Offline Multi-Threading Engine</span>
              <span className="opacity-50">|</span>
              <span className="bg-sky-500/20 text-sky-200 border border-sky-400/25 px-1.5 py-0.2 rounded text-[9px] uppercase font-bold">Snapdragon Approved</span>
            </p>
          </div>
        </div>

        {/* Global Control utilities */}
        <div className="flex items-center gap-2">
          
          {/* Offline indicator bar */}
          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold font-sans text-[10px] px-2.5 py-1 rounded-full select-none">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>OFFLINE LOCAL MODE</span>
          </div>

          {/* Obsidian dark mode glass toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            id="theme-dark-toggle"
            className="aero-button aero-button-aqua w-9 h-8 flex items-center justify-center text-blue-900 font-semibold"
            title="Toggle Obsidian Glass theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-blue-950" />}
          </button>

        </div>
      </header>

      {/* Main Layout Desktop Workspace Grid */}
      <main className="w-full max-w-7xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 p-1">
        
        {/* Left Side: Desktop Main Control Hub Frame (Grid Col 8) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col space-y-5">
          
          {/* Window 1: Encoder Core Controls & Process List */}
          <AeroWindow
            id="main-transcoder-window"
            title="Aero Encode Dashboard v2.0"
            icon={<Film className="w-4 h-4" />}
            isActive={activeWindow === 'transcoder'}
            onFocus={() => setActiveWindow('transcoder')}
            isDarkMode={isDarkMode}
            statusBarText={isProcessing ? `Processing batch file [${processingIndex + 1}/${queue.length}] - Encoding raw buffers...` : 'Transcoder Core Idle'}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* Settings configuration form (Col 5) */}
              <div className="md:col-span-5 space-y-4">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px] uppercase tracking-wide border-b border-white/5 pb-2">
                  <Settings2 className="w-4 h-4" /> Codec Matrix Presets
                </div>
                <EncoderControls
                  settings={settings}
                  onChange={setSettings}
                  isDarkMode={isDarkMode}
                />
              </div>

              {/* Advanced Interactive Batch queue (Col 7) */}
              <div className="md:col-span-7 space-y-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px] uppercase tracking-wide border-b border-white/5 pb-2 mb-2">
                    <Layers className="w-4 h-4" /> Live Video Stream Playlist Queue
                  </div>
                  <BatchQueue
                    queue={queue}
                    setQueue={setQueue}
                    isProcessing={isProcessing}
                    onStartBatch={handleStartTranscodeBatch}
                    onCancelBatch={handleCancelTranscodeBatch}
                    settings={settings}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>

            </div>
          </AeroWindow>

          {/* Window 2: Virtual Windows explorer tree (Destinations Folder manager) */}
          <AeroWindow
            id="explorer-filesystem-window"
            title="Aero Shell File Explorer (Target Partition)"
            icon={<FolderOpen className="w-4 h-4" />}
            isActive={activeWindow === 'explorer'}
            onFocus={() => setActiveWindow('explorer')}
            isDarkMode={isDarkMode}
            statusBarText={`Active Directory: ${exportPath}`}
          >
            <VirtualFileSystem
              exportPath={exportPath}
              setExportPath={setExportPath}
              folders={folders}
              setFolders={setFolders}
              activeFolderId={activeFolderId}
              setActiveFolderId={setActiveFolderId}
              isDarkMode={isDarkMode}
            />
          </AeroWindow>

        </div>

        {/* Right Side: Sidebar Gadget Dashboard Panel Grid (Grid Col 4) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col space-y-5">
          
          {/* Aero Sidebar Window component 3: Preview GPU Monitor */}
          <AeroWindow
            id="gpu-preview-window"
            title="Aero GPU Preview Buffer"
            icon={<Tv className="w-4 h-4 text-emerald-400" />}
            isActive={activeWindow === 'preview'}
            onFocus={() => setActiveWindow('preview')}
            isDarkMode={isDarkMode}
            statusBarText={isProcessing ? 'Streaming raw frames to decimate buffer' : 'Frame buffer loaded'}
          >
            <VisualPreview
              activeFile={activeVideoFile}
              settings={settings}
              isProcessing={isProcessing}
              isDarkMode={isDarkMode}
            />
          </AeroWindow>

          {/* Aero Sidebar gadget 4: Qualcomm Snapdragon active telemetry panel */}
          <AeroWindow
            id="telemetry-gadget"
            title="Snapdragon® SOC Telemetry Widget"
            icon={<Cpu className="w-4 h-4 text-indigo-400" />}
            isActive={activeWindow === 'telemetry'}
            onFocus={() => setActiveWindow('telemetry')}
            isDarkMode={isDarkMode}
            statusBarText="Kryo Coherent Coprocessors Active"
          >
            <SystemTelemetry
              settings={settings}
              isProcessing={isProcessing}
              isDarkMode={isDarkMode}
            />
          </AeroWindow>

          {/* Nostalgic Windows sidebar float calendar clock widgets */}
          <div className="grid grid-cols-2 gap-3 mt-1.5 select-none opacity-85 hover:opacity-100 transition-opacity">
            
            {/* Round Clock Sidebar Gadget representation */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center shadow-md
              ${isDarkMode ? 'bg-slate-900/35 border-white/5' : 'bg-white/35 border-slate-900/10'} backdrop-blur-md aero-shine
            `}>
              <Clock className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Aero System Time</span>
              <span className="text-sm font-mono font-extrabold text-slate-100 mt-0.5 tracking-wider">{timeText}</span>
            </div>

            {/* Calendar Sidebar Gadget representation */}
            <div className={`p-3 rounded-lg border flex flex-col items-center justify-center text-center shadow-md
              ${isDarkMode ? 'bg-slate-900/35 border-white/5' : 'bg-white/35 border-slate-900/10'} backdrop-blur-md aero-shine
            `}>
              <Calendar className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Aero Date</span>
              <span className="text-xs font-semibold text-slate-100 mt-1">June 2026</span>
            </div>

          </div>

        </div>

      </main>

      {/* Retro Vista Taskbar representing bottom desktop controls */}
      <footer className="w-full max-w-7xl mx-auto mt-6 bg-slate-950/65 backdrop-blur-md border border-white/10 rounded-lg p-2 flex items-center justify-between z-30 select-none relative shadow-xl">
        
        {/* Nostalgic Windows start orb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsStartMenuOpen(!isStartMenuOpen)}
            id="start-orb-btn"
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-600 via-teal-500 to-sky-400 flex items-center justify-center border-2 border-white/30 hover:scale-105 active:scale-95 duration-100 shadow-[0_0_15px_rgba(0,162,237,0.55)] cursor-pointer select-none"
            title="Click to open Windows Aero Start Panel"
          >
            <Tv className="w-5.5 h-5.5 text-white drop-shadow" />
          </button>
          
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-sans font-medium text-slate-400">
            <span className="bg-slate-800 px-2.5 py-1 rounded border border-white/5 text-sky-400 font-bold">C: Logical drive</span>
            <span className="opacity-40">/</span>
            <span className="text-[10px] text-slate-500 font-mono">Build status: Green / Active</span>
          </div>
        </div>

        {/* Dynamic Quick Launch icons */}
        <div className="flex items-center gap-1.5 pl-6">
          <button
            onClick={() => {
              setActiveWindow('transcoder');
              const dest = document.getElementById('window-aero-encode-dashboard-v2.0');
              dest?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-2 rounded hover:bg-white/15 transition-all text-slate-300 ${activeWindow === 'transcoder' ? 'bg-white/10 text-sky-400' : ''}`}
            title="Encoder Deck"
          >
            <Film className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setActiveWindow('explorer');
              const dest = document.getElementById('window-aero-shell-file-explorer-(target-partition)');
              dest?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-2 rounded hover:bg-white/15 transition-all text-slate-300 ${activeWindow === 'explorer' ? 'bg-white/10 text-sky-400' : ''}`}
            title="Folder Explorer"
          >
            <FolderOpen className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setActiveWindow('preview');
              const dest = document.getElementById('window-aero-gpu-preview-buffer');
              dest?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`p-2 rounded hover:bg-white/15 transition-all text-slate-300 ${activeWindow === 'preview' ? 'bg-white/10 text-emerald-400' : ''}`}
            title="GPU buffer monitor"
          >
            <Tv className="w-4 h-4" />
          </button>
        </div>

        {/* Clock calendar taskbar widget */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/40 rounded border border-white/5 font-mono text-[11px] text-slate-400 select-none">
          <span>{timeText || '12:00 PM'}</span>
          <span className="opacity-50">|</span>
          <span className="text-[10.5px]">06/22/2026</span>
        </div>

        {/* Aero Glass Pop up classic Start Menu representation */}
        {isStartMenuOpen && (
          <div 
            id="start-menu-overlay"
            className={`
              absolute bottom-14 left-2 w-[280px] p-4 rounded-lg flex flex-col shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-150 border
              ${isDarkMode ? 'aero-glass-dark text-slate-200' : 'aero-glass-light text-slate-800'}
            `}
          >
            {/* Header User profile profile */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center border border-white/20 shadow text-white select-none shrink-0 font-bold text-sm font-sans uppercase">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-100 flex items-center gap-1 font-sans">
                  Video Enthusiast <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                </h4>
                <p className="text-[9.5px] text-slate-400 leading-none">System Rank: Architect</p>
              </div>
            </div>

            {/* Quick Fast travel links */}
            <div className="space-y-1.5 flex-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold pl-1">Windows Utility Hub</div>
              
              <button
                onClick={() => {
                  setSettings({ ...settings, codec: 'AV1', resolution: { width: 1920, height: 1080, custom: false }, bitrate: 4500, performanceMode: 'high_perf' });
                  setIsStartMenuOpen(false);
                  setActiveWindow('transcoder');
                }}
                className="w-full text-left p-1.5 rounded hover:bg-sky-500/10 text-[11px] font-sans flex items-center gap-2 group transition-colors cursor-pointer text-stone-300"
              >
                <Flame className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>Preset: Snapdragon AV1 FHD</span>
              </button>

              <button
                onClick={() => {
                  setSettings({ ...settings, codec: 'VP9', resolution: { width: 1280, height: 720, custom: false }, bitrate: 2000, performanceMode: 'eco' });
                  setIsStartMenuOpen(false);
                  setActiveWindow('transcoder');
                }}
                className="w-full text-left p-1.5 rounded hover:bg-sky-500/10 text-[11px] font-sans flex items-center gap-2 group transition-colors cursor-pointer text-stone-300"
              >
                <Cpu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>Preset: Snapdragon Eco VP9 HD</span>
              </button>

              <button
                onClick={() => {
                  setQueue([]);
                  setIsStartMenuOpen(false);
                  alert('Batch queue has been successfully wiped. Buffers clean.');
                }}
                className="w-full text-left p-1.5 rounded hover:bg-sky-500/10 text-[11px] font-sans flex items-center gap-2 group transition-colors cursor-pointer text-stone-300"
              >
                <HardDrive className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform shrink-0" />
                <span>Reset Local Temporary DB</span>
              </button>
            </div>

            {/* Bottom Footer power-down lock */}
            <div className="border-t border-white/10 pt-2.5 mt-3 flex items-center justify-between text-[10.5px]">
              <span className="text-slate-400 font-mono font-medium">SOC Cooling is secure ✔</span>
              <button
                onClick={() => setIsStartMenuOpen(false)}
                className="aero-button px-3 py-1 bg-rose-600/20 text-rose-400 border-rose-500/20 hover:bg-rose-600/35 uppercase font-bold text-[9px]"
              >
                Close Menu
              </button>
            </div>
          </div>
        )}

      </footer>

    </div>
  );
}
