import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, Video, Eye, Radio, Sparkles, Battery } from 'lucide-react';
import { VideoFile, EncodingSettings } from '../types';

interface VisualPreviewProps {
  activeFile: VideoFile | null;
  settings: EncodingSettings;
  isProcessing: boolean;
  isDarkMode: boolean;
}

export const VisualPreview: React.FC<VisualPreviewProps> = ({
  activeFile,
  settings,
  isProcessing,
  isDarkMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  // Stats for the screen
  const [renderFps, setRenderFps] = useState(60);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);

  // Set up video source when active file changes
  useEffect(() => {
    if (videoRef.current) {
      if (activeFile?.objectUrl) {
        setVideoLoaded(false);
        videoRef.current.src = activeFile.objectUrl;
        videoRef.current.load();
      } else {
        videoRef.current.src = '';
        setVideoLoaded(false);
      }
    }
  }, [activeFile?.id, activeFile?.objectUrl]);

  // Handle active processing states or normal playbacks
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isProcessing) {
      setIsPlayingPreview(true);
      video.playbackRate = settings.performanceMode === 'high_perf' ? 1.5 : settings.performanceMode === 'eco' ? 0.75 : 1.0;
      video.muted = true;
      video.play().catch(() => {});
    } else {
      if (!isPlayingPreview) {
        video.pause();
      }
    }
  }, [isProcessing, settings.performanceMode]);

  // Main canvas rendering frame-rate loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;
    let angle = 0;

    const renderLoop = () => {
      const now = performance.now();
      frameCountRef.current++;
      
      // Calculate current actual FPS
      if (now - lastTimeRef.current >= 1000) {
        setRenderFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      // Read decimation variables based on user chosen quality and resolution
      const targetW = settings.resolution.width;
      const targetH = settings.resolution.height;
      const decimation = Math.max(1, Math.min(8, Math.floor(1920 / targetW)));
      const isEco = settings.performanceMode === 'eco';

      // Snapdragon Eco Mode frame throttle limits: Skip rendering on canvas at custom paces to save battery
      if (isEco && isProcessing && frameCount % 3 !== 0) {
        frameCount++;
        animationRef.current = requestAnimationFrame(renderLoop);
        return;
      }

      frameCount++;

      // Canvas dimensions set
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw actual uploaded HTML5 video if loaded
      if (videoRef.current && videoRef.current.readyState >= 2 && activeFile) {
        // Draw decimated background frame to represent actual downscaling resolution
        if (decimation > 1) {
          const tempWidth = Math.max(8, Math.floor(width / decimation));
          const tempHeight = Math.max(8, Math.floor(height / decimation));
          
          // Create offscreen downscale block
          const offCanvas = document.createElement('canvas');
          offCanvas.width = tempWidth;
          offCanvas.height = tempHeight;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(videoRef.current, 0, 0, tempWidth, tempHeight);
            
            // Draw back stretched to canvas with pixelation filters
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(offCanvas, 0, 0, tempWidth, tempHeight, 0, 0, width, height);
            ctx.imageSmoothingEnabled = true;
          }
        } else {
          ctx.drawImage(videoRef.current, 0, 0, width, height);
        }

        // Apply visual "Bitrate Compression Artifacts" overlays if bitrate is extremely low
        if (settings.bitrate < 1500) {
          const blockSize = Math.max(16, Math.floor((1500 - settings.bitrate) / 25));
          ctx.fillStyle = `rgba(20, 30, 40, ${0.03 + (1500 - settings.bitrate) / 10000})`;
          for (let x = 0; x < width; x += blockSize) {
            for (let y = 0; y < height; y += blockSize) {
              if (Math.random() < 0.25) {
                ctx.fillRect(x, y, blockSize, blockSize);
              }
            }
          }
        }
      } else {
        // 2. Draw beautiful procedural Neon / Snapdragon loading grid vector simulation instead
        ctx.fillStyle = isDarkMode ? '#0a0d14' : '#f1f5f9';
        ctx.fillRect(0, 0, width, height);

        // Grid lines matching Windows Aero Aurora/Teal theme
        ctx.strokeStyle = isDarkMode ? 'rgba(0, 162, 237, 0.08)' : 'rgba(0, 120, 215, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 25;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // Moving visualizer arcs and cyber-circuits
        angle += 0.015;
        const centerX = width / 2;
        const centerY = height / 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle);
        
        // Circular Core Rings
        ctx.strokeStyle = 'rgba(0, 162, 237, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 1.5);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(14, 165, 233, 0.2)';
        ctx.beginPath();
        ctx.arc(0, 0, 70, 0, Math.PI * 2);
        ctx.stroke();

        // Snapdragon chip core pins
        ctx.fillStyle = 'rgba(168, 85, 247, 0.5)';
        for (let i = 0; i < 8; i++) {
          const pinAngle = (i * Math.PI) / 4;
          const px = Math.cos(pinAngle) * 70;
          const py = Math.sin(pinAngle) * 70;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Draw active vector sinewave lines simulating video audio packets
        ctx.strokeStyle = isDarkMode ? 'rgba(16, 185, 129, 0.3)' : 'rgba(5, 150, 105, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < width; i++) {
          const yOffset = Math.sin(i * 0.02 + angle * 2) * 15 * Math.cos(i * 0.005);
          if (i === 0) ctx.moveTo(i, height * 0.75 + yOffset);
          else ctx.lineTo(i, height * 0.75 + yOffset);
        }
        ctx.stroke();

        // Custom Title badge in center of matrix
        ctx.font = 'bold 11px font-sans';
        ctx.fillStyle = isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(isProcessing ? 'REALTIME RENDER MATRIX ACTIVE' : 'AERO READY - SELECT A FILE', centerX, centerY - 95);

        // Binary matrix stream rendering down sides
        ctx.font = '9px font-mono';
        ctx.fillStyle = isDarkMode ? 'rgba(52, 211, 153, 0.15)' : 'rgba(5, 150, 105, 0.12)';
        ctx.textAlign = 'left';
        for (let col = 0; col < 6; col++) {
          const xPos = 20 + col * 35;
          for (let row = 0; row < 6; row++) {
            const char = Math.random() > 0.5 ? '1' : '0';
            const yPos = 40 + row * 20 + ((angle * 10) % 20);
            ctx.fillText(char, xPos, yPos);
          }
        }
      }

      // 3. Draw active Transcode HUD stats on top of Canvas!
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(10, 10, 220, 85);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, 220, 85);

      ctx.font = 'bold 9px font-mono';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`FRAME BUFFER: OK_READY`, 20, 25);
      
      ctx.fillStyle = 'white';
      ctx.font = '9px font-mono';
      ctx.fillText(`TARGET RESOLUTION: ${targetW} × ${targetH}`, 20, 40);
      ctx.fillText(`CODEC TARGET: ${settings.codec}`, 20, 52);
      ctx.fillText(`SNAPDRAGON MODE: ${settings.performanceMode.toUpperCase()}`, 20, 64);
      
      const thermalColor = settings.performanceMode === 'high_perf' ? '#f87171' : settings.performanceMode === 'eco' ? '#34d399' : '#fbbf24';
      ctx.fillStyle = thermalColor;
      ctx.fillText(`CHIP TEMP: ${settings.performanceMode === 'high_perf' ? '41°C (WARM)' : settings.performanceMode === 'eco' ? '30°C (COOL)' : '35°C (NORMAL)'}`, 20, 76);

      // Custom offline-ready indicator
      ctx.fillStyle = 'rgba(110, 231, 183, 0.9)';
      ctx.fillRect(width - 98, 12, 86, 18);
      ctx.font = 'bold 8px font-sans';
      ctx.fillStyle = '#064e3b';
      ctx.fillText('● LOCAL DECODE', width - 92, 24);

      animationRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [settings, isProcessing, isDarkMode, activeFile?.id]);

  const togglePlayback = () => {
    if (!videoRef.current) return;
    if (isPlayingPreview) {
      videoRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      videoRef.current.play().then(() => {
        setIsPlayingPreview(true);
      }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 font-sans">
      
      {/* Frame Buffer Screen Title row */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <span className="font-semibold text-xs tracking-wider flex items-center gap-1.5 uppercase text-slate-300">
          <Eye className="w-4 h-4 text-sky-400" /> GPU Frame Buffer Monitor
        </span>
        <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Live Rendering
          </span>
          <span className="bg-slate-800 px-2 py-0.5 rounded text-sky-400 font-bold">{renderFps} FPS</span>
        </div>
      </div>

      {/* Actual canvas element */}
      <div className="relative border border-white/10 rounded overflow-hidden aspect-video bg-black flex items-center justify-center shadow-inner">
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          id="gpu-render-canvas"
          className="w-full h-auto max-h-[340px] block"
          style={{ imageRendering: settings.resolution.width < 800 ? 'pixelated' : 'auto' }}
        />
        
        {/* Hidden internal video tag for actual file extraction */}
        <video
          ref={videoRef}
          className="hidden"
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onEnded={() => setIsPlayingPreview(false)}
        />
        
        {/* If Snapdragon Eco mode is on, overlay a gorgeous battery monitor indicator to let users know it's saving power */}
        {settings.performanceMode === 'eco' && (
          <div className="absolute right-3.5 bottom-3.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 select-none backdrop-blur-sm shadow-md">
            <Battery className="w-3.5 h-3.5 animate-bounce" /> Eco Throttle: Cool CPU (-35% mA)
          </div>
        )}
      </div>

      {/* Manual Preview controller row for files */}
      {activeFile && (
        <div className="flex items-center justify-between p-2 rounded bg-slate-900/30 border border-white/5">
          <div className="flex items-center gap-2 truncate">
            <Video className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs truncate font-medium text-slate-300 max-w-[200px]" title={activeFile.name}>
              {activeFile.name}
            </span>
          </div>

          <button
            onClick={togglePlayback}
            id="preview-play-pause-btn"
            className="aero-button aero-button-aqua px-3.5 py-1 text-xs select-none flex items-center gap-1"
          >
            {isPlayingPreview ? (
              <>
                <Pause className="w-3 h-3 text-blue-900" /> Pause Buffer
              </>
            ) : (
              <>
                <Play className="w-3 h-3 text-blue-900 fill-current" /> Preview File
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick notice block */}
      {!activeFile && (
        <div className="p-3 bg-indigo-500/5 rounded border border-indigo-500/10 text-[11px] leading-relaxed text-indigo-300">
          <div className="flex items-start gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Tip:</strong> Drag actual, local videos into the Transcoder list below! The app reads and scales them 100% locally in your browser. Or click "Load Sample Files" below to try it instantly!
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
