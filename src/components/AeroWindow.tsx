import React from 'react';
import { Minus, Square, X } from 'lucide-react';

interface AeroWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  width?: string;
  height?: string;
  isActive: boolean;
  onFocus?: () => void;
  onClose?: () => void;
  onMinimize?: () => void;
  isDarkMode: boolean;
  children: React.ReactNode;
  statusBarText?: string;
}

export const AeroWindow: React.FC<AeroWindowProps> = ({
  title,
  icon,
  width = 'max-w-4xl',
  height,
  isActive,
  onFocus,
  onClose,
  onMinimize,
  isDarkMode,
  children,
  statusBarText = 'Ready',
}) => {
  return (
    <div
      onClick={onFocus}
      className={`
        ${width} ${height || ''} w-full flex flex-col rounded-t-lg rounded-b-md shadow-2xl transition-all duration-200
        ${isDarkMode ? 'aero-glass-dark text-gray-100' : 'aero-glass-light text-slate-800'}
        ${isActive ? 'ring-2 ring-sky-400/40 shadow-sky-500/10' : 'opacity-95'}
        aero-shine border-t-[1.5px] border-x-[1.5px] border-b-[2.5px] select-none
      `}
      id={`window-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Aero Titlebar / Frame Header */}
      <div 
        className={`
          flex items-center justify-between px-3 py-2 border-b border-white/20 rounded-t-lg cursor-default
          ${isActive 
            ? 'bg-gradient-to-r from-sky-500/20 via-sky-400/10 to-teal-500/15' 
            : 'bg-white/5'
          }
        `}
      >
        {/* Title & Icon */}
        <div className="flex items-center gap-2 font-sans font-medium text-[13px] tracking-wide truncate">
          <div className={`p-1 rounded ${isActive ? 'text-sky-300' : 'text-slate-400'}`}>
            {icon}
          </div>
          <span 
            className={`
              font-semibold drop-shadow-[0_1px_3px_rgba(255,255,255,0.8)]
              ${isDarkMode ? 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] text-slate-100' : 'text-slate-800'}
            `}
          >
            {title}
          </span>
        </div>

        {/* Windows Vista Title bar Buttons */}
        <div className="flex items-center gap-1.5 pl-4 shrink-0">
          {/* Minimize */}
          {onMinimize && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
              id={`minimize-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-7 h-5 flex items-center justify-center rounded border border-white/25 bg-white/10 hover:bg-white/25 active:bg-white/40 transition-colors"
              title="Minimize"
            >
              <Minus className="w-3 h-3 text-slate-300 pointer-events-none" />
            </button>
          )}

          {/* Maximize */}
          <button
            id={`maximize-${title.toLowerCase().replace(/\s+/g, '-')}`}
            className="w-7 h-5 flex items-center justify-center rounded border border-white/15 bg-white/5 opacity-55 cursor-not-allowed"
            title="Maximize (Fixed Layout)"
            disabled
          >
            <Square className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {/* Close red gloss block */}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              id={`close-${title.toLowerCase().replace(/\s+/g, '-')}`}
              className="w-11 h-5 flex items-center justify-center rounded-r rounded-l-sm aero-close-btn font-bold text-xs"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Inner Window Frame Content Body */}
      <div className="flex-1 p-4 bg-slate-900/5 backdrop-blur-[2px] overflow-auto">
        <div className="h-full">
          {children}
        </div>
      </div>

      {/* Aero Windows Explorer-style Status Bar */}
      <div 
        className={`
          flex items-center justify-between px-3.5 py-1 text-[11px] font-sans font-medium border-t rounded-b-md
          ${isDarkMode ? 'bg-slate-900/40 border-white/5 text-slate-400' : 'bg-slate-100/40 border-slate-900/5 text-slate-500'}
        `}
      >
        <span>{statusBarText}</span>
        <div className="flex items-center gap-3">
          <span className="opacity-70">CPU: Snapdragon Profiler</span>
          <span className="opacity-70">Region: Local / Encrypted</span>
        </div>
      </div>
    </div>
  );
};
