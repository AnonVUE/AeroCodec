import React, { useRef, useState } from 'react';
import { UploadCloud, Film, Play, AlertCircle, Trash2, CheckCircle2, RefreshCw, XOctagon } from 'lucide-react';
import { VideoFile, EncodingSettings } from '../types';

interface BatchQueueProps {
  queue: VideoFile[];
  setQueue: React.Dispatch<React.SetStateAction<VideoFile[]>>;
  isProcessing: boolean;
  onStartBatch: () => void;
  onCancelBatch: () => void;
  settings: EncodingSettings;
  isDarkMode: boolean;
}

export const BatchQueue: React.FC<BatchQueueProps> = ({
  queue,
  setQueue,
  isProcessing,
  onStartBatch,
  onCancelBatch,
  settings,
  isDarkMode,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Instantly resolve true width, height, & seconds duration of user's custom file using video buffers
  const parseVideoMetadata = (file: File): Promise<{ width: number; height: number; duration: number }> => {
    return new Promise((resolve) => {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.src = URL.createObjectURL(file);
      
      videoElement.onloadedmetadata = () => {
        URL.revokeObjectURL(videoElement.src);
        resolve({
          width: videoElement.videoWidth || 1280,
          height: videoElement.videoHeight || 720,
          duration: Math.round(videoElement.duration) || 10,
        });
      };

      videoElement.onerror = () => {
        resolve({ width: 1280, height: 720, duration: 8 });
      };
    });
  };

  const handleFilesAdded = async (files: FileList) => {
    const newItems: VideoFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/') && !file.name.endsWith('.mkv') && !file.name.endsWith('.avi')) {
        continue;
      }

      const meta = await parseVideoMetadata(file);

      newItems.push({
        id: `local_${Date.now()}_${i}`,
        name: file.name,
        fileSize: file.size,
        duration: meta.duration,
        width: meta.width,
        height: meta.height,
        status: 'queued',
        progress: 0,
        elapsedTime: 0,
        estimatedRemainingTime: 0,
        targetCodec: settings.codec,
        targetWidth: settings.resolution.width,
        targetHeight: settings.resolution.height,
        targetBitrate: settings.bitrate,
        actualFps: 0,
        objectUrl: URL.createObjectURL(file), // store reference to play in buffer
      });
    }

    setQueue((prev) => [...prev, ...newItems]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const loadSampleNostalgiaFiles = () => {
    const samples: VideoFile[] = [
      {
        id: 'sample_nebula',
        name: 'aero_starfields_1080p.raw',
        fileSize: 18741000,
        duration: 20,
        width: 1920,
        height: 1080,
        status: 'queued',
        progress: 0,
        elapsedTime: 0,
        estimatedRemainingTime: 0,
        targetCodec: settings.codec,
        targetWidth: settings.resolution.width,
        targetHeight: settings.resolution.height,
        targetBitrate: settings.bitrate,
        actualFps: 0,
        objectUrl: '', // empty to trigger canvas procedural render logic
      },
      {
        id: 'sample_cyber',
        name: 'tokyo_neon_drift_2k.mov',
        fileSize: 45892000,
        duration: 35,
        width: 2560,
        height: 1440,
        status: 'queued',
        progress: 0,
        elapsedTime: 0,
        estimatedRemainingTime: 0,
        targetCodec: settings.codec,
        targetWidth: settings.resolution.width,
        targetHeight: settings.resolution.height,
        targetBitrate: settings.bitrate,
        actualFps: 0,
        objectUrl: '',
      },
      {
        id: 'sample_sunset',
        name: 'synthwave_sunset_loop.avi',
        fileSize: 8430000,
        duration: 12,
        width: 1280,
        height: 720,
        status: 'queued',
        progress: 0,
        elapsedTime: 0,
        estimatedRemainingTime: 0,
        targetCodec: settings.codec,
        targetWidth: settings.resolution.width,
        targetHeight: settings.resolution.height,
        targetBitrate: settings.bitrate,
        actualFps: 0,
        objectUrl: '',
      }
    ];

    setQueue((prev) => [...prev, ...samples]);
  };

  const clearQueue = () => {
    // Revoke any created object URLs to prevent RAM leaks
    queue.forEach((q) => {
      if (q.objectUrl && q.id.startsWith('local_')) {
        URL.revokeObjectURL(q.objectUrl);
      }
    });
    setQueue([]);
  };

  const removeFromQueue = (id: string) => {
    const target = queue.find((q) => q.id === id);
    if (target?.objectUrl && target.id.startsWith('local_')) {
      URL.revokeObjectURL(target.objectUrl);
    }
    setQueue((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className={`space-y-4 font-sans text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Drag & Drop uploader area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        id="drag-drop-container"
        className={`
          p-5 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all select-none
          ${dragActive 
            ? 'border-sky-400 bg-sky-500/10 scale-[0.99] shadow-sky-500/10' 
            : isDarkMode ? 'border-white/10 bg-slate-900/10 hover:bg-slate-900/20' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          id="raw-video-file-input"
          multiple
          accept="video/*,.mkv,.avi"
          className="hidden"
          onChange={handleFileChange}
        />
        <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" />
        <span className="font-semibold text-xs block mb-1">Drag & Drop RAW files here</span>
        <span className="text-[10px] text-slate-500">Supports MP4, MKV, WebM, AVI raw buffers. Local browser direct parsing.</span>
      </div>

      {/* Batch Processing Table Actions container */}
      <div className="flex gap-2 justify-between items-center bg-slate-950/20 p-2 border border-white/5 rounded">
        <div className="flex gap-1.5 items-center">
          {!isProcessing ? (
            <button
              onClick={onStartBatch}
              disabled={queue.length === 0}
              id="start-transcoding-btn"
              className={`
                aero-button px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 select-none
                ${queue.some((q) => q.status === 'queued') 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-600' 
                  : 'bg-slate-800 border-white/15 text-slate-500 cursor-not-allowed opacity-50'
                }
              `}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Encoding Batch
            </button>
          ) : (
            <button
              onClick={onCancelBatch}
              id="cancel-transcoding-btn"
              className="aero-button bg-red-600 border-red-700 hover:brightness-110 active:brightness-95 text-white px-4 py-1.5 text-xs font-bold flex items-center gap-1.5 select-none"
            >
              <XOctagon className="w-3.5 h-3.5" /> Stop / Abort Thread
            </button>
          )}

          <button
            onClick={loadSampleNostalgiaFiles}
            disabled={isProcessing}
            id="load-samples-btn"
            className="aero-button aero-button-aqua px-3.5 py-1.5 text-xs select-none"
          >
            Load Sample Files
          </button>
        </div>

        {queue.length > 0 && !isProcessing && (
          <button
            onClick={clearQueue}
            id="clear-queue-btn"
            className="p-1.5 rounded hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 font-medium transition-colors cursor-pointer"
          >
            Clear List
          </button>
        )}
      </div>

      {/* Queued list table */}
      <div className={`border aero-scrollbar rounded overflow-hidden flex flex-col h-[200px]
        ${isDarkMode ? 'bg-slate-950/45 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner
      `}>
        
        {/* Table Head */}
        <div className="grid grid-cols-12 gap-2 p-2 font-bold uppercase text-[9.5px] border-b border-white/10 bg-slate-900/20 text-slate-400 select-none shrink-0">
          <span className="col-span-5">Raw Video Source</span>
          <span className="col-span-2 text-right">Original Resolution</span>
          <span className="col-span-1.5 text-right">Format</span>
          <span className="col-span-2 text-center">Status / Progress</span>
          <span className="col-span-1 text-center">Delete</span>
        </div>

        {/* Table Body queue list with native Vista green glassy styling for processing streams! */}
        <div className="flex-1 overflow-y-auto p-1 space-y-1">
          {queue.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-1">
              <Film className="w-8 h-8 text-slate-600 animate-pulse" />
              <span className="text-slate-400 font-medium text-xs">Transcode queue is empty</span>
              <p className="text-[10px] text-slate-500">Add local video elements or load sample files to start.</p>
            </div>
          ) : (
            queue.map((item) => {
              const isItemProcessing = item.status === 'processing';
              const isItemCompleted = item.status === 'completed';
              const fileMb = (item.fileSize / (1024 * 1024)).toFixed(1);

              return (
                <div
                  key={item.id}
                  className={`
                    grid grid-cols-12 gap-2 p-1.5 rounded transition-colors items-center font-sans text-stone-300
                    ${isItemProcessing ? 'bg-sky-500/10 border-l-2 border-sky-400' : 'hover:bg-white/5'}
                  `}
                >
                  {/* File information */}
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <Film className={`w-3.5 h-3.5 shrink-0 ${isItemProcessing ? 'text-sky-400' : 'text-slate-400'}`} />
                    <div className="truncate flex flex-col">
                      <span className="truncate font-semibold text-slate-200" title={item.name}>{item.name}</span>
                      <span className="text-[9px] text-slate-500 font-mono font-medium">Size: {fileMb} MB | Duration: {item.duration}s</span>
                    </div>
                  </div>

                  {/* Physical width x height */}
                  <span className="col-span-2 text-right font-mono font-semibold text-slate-400">
                    {item.width} × {item.height}
                  </span>

                  {/* Codec */}
                  <span className="col-span-1.5 text-right font-mono font-bold text-slate-300 text-[10px] truncate">
                    {item.targetCodec}
                  </span>

                  {/* Progress Block / Green Striped Vista glider */}
                  <div className="col-span-2 px-1">
                    {isItemProcessing ? (
                      <div className="space-y-1 text-center">
                        <div className="flex justify-between font-mono text-[9px] text-sky-400 font-semibold leading-none">
                          <span>{item.actualFps} FPS</span>
                          <span>{item.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-950/40 h-2 rounded overflow-hidden relative border border-white/5">
                          <div
                            className="aero-progress-bar h-full transition-all duration-300"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : isItemCompleted ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Done
                      </div>
                    ) : item.status === 'cancelled' ? (
                      <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /> Aborted
                      </div>
                    ) : (
                      <div className="text-center font-mono font-medium text-slate-500 text-[9.5px]">
                        Pending
                      </div>
                    )}
                  </div>

                  {/* Delete Item column icon */}
                  <div className="col-span-1 flex justify-center text-center">
                    <button
                      disabled={isItemProcessing || isProcessing}
                      onClick={() => removeFromQueue(item.id)}
                      id={`delete-queue-item-${item.id}`}
                      className={`
                        p-1 rounded text-slate-500 hover:text-rose-400 transition-colors
                        ${isProcessing ? 'opacity-30 cursor-not-allowed' : 'hover:bg-rose-500/10 cursor-pointer'}
                      `}
                      title="Remove from batch list"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
