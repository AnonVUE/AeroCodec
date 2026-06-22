import React, { useState } from 'react';
import { Folder, HardDrive, Search, ChevronRight, FileVideo, PlusCircle, Trash2, ArrowRight } from 'lucide-react';
import { VirtualFolder } from '../types';

interface VirtualFileSystemProps {
  exportPath: string;
  setExportPath: (path: string) => void;
  folders: VirtualFolder[];
  setFolders: React.Dispatch<React.SetStateAction<VirtualFolder[]>>;
  activeFolderId: string;
  setActiveFolderId: (id: string) => void;
  isDarkMode: boolean;
}

export const VirtualFileSystem: React.FC<VirtualFileSystemProps> = ({
  exportPath,
  setExportPath,
  folders,
  setFolders,
  activeFolderId,
  setActiveFolderId,
  isDarkMode,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFolder = folders.find((f) => f.id === activeFolderId) || folders[0];

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const formattedName = newFolderName.trim().replace(/[^a-zA-Z0-9_\s-]/g, '');
    const newId = formattedName.toLowerCase().replace(/\s+/g, '_');

    // Shield against duplicate folders
    if (folders.some((f) => f.id === newId)) {
      alert('A directory with this name already exists!');
      return;
    }

    const newPath = `${activeFolder.path}\\${formattedName}`;
    const newFolder: VirtualFolder = {
      id: newId,
      name: formattedName,
      path: newPath,
      files: [],
    };

    setFolders([...folders, newFolder]);
    setActiveFolderId(newId);
    setExportPath(newPath);
    setNewFolderName('');
  };

  const handleDeleteFile = (fileName: string) => {
    setFolders((prevFolders) =>
      prevFolders.map((f) => {
        if (f.id === activeFolder.id) {
          return {
            ...f,
            files: f.files.filter((file) => file.name !== fileName),
          };
        }
        return f;
      })
    );
  };

  const handleSelectFolder = (folder: VirtualFolder) => {
    setActiveFolderId(folder.id);
    setExportPath(folder.path);
  };

  const handleCustomPathChange = (val: string) => {
    setExportPath(val);
    // Find matching folder or edit existing active one
    setFolders((prevFolders) =>
      prevFolders.map((f) => {
        if (f.id === activeFolder.id) {
          return { ...f, path: val };
        }
        return f;
      })
    );
  };

  // Filter exported files list based on search bar query
  const filteredFiles = activeFolder.files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col md:flex-row h-full gap-4 font-sans text-xs ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
      
      {/* Left Tree Explorer directory list */}
      <div className="w-full md:w-1/3 flex flex-col space-y-3">
        <div className="font-semibold uppercase tracking-wider text-[10px] text-sky-400 flex items-center gap-1">
          <HardDrive className="w-3.5 h-3.5" /> Logical Disk Partition (C:)
        </div>

        {/* Tree List */}
        <div className={`p-2 rounded border aero-scrollbar h-[200px] md:h-full overflow-y-auto space-y-1.5
          ${isDarkMode ? 'bg-slate-950/45 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner
        `}>
          {folders.map((folder) => {
            const isCurrentlySelected = folder.id === activeFolderId;
            return (
              <button
                key={folder.id}
                id={`folder-tree-node-${folder.id}`}
                onClick={() => handleSelectFolder(folder)}
                className={`
                  w-full p-2 rounded flex items-center justify-between text-left transition-colors cursor-pointer group
                  ${isCurrentlySelected 
                    ? 'bg-sky-500/15 border border-sky-500/30 text-sky-400 font-semibold' 
                    : 'hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className={`w-4 h-4 shrink-0 ${isCurrentlySelected ? 'text-sky-300' : 'text-amber-400'}`} />
                  <span className="truncate">{folder.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[9px] opacity-70 group-hover:opacity-100 font-mono bg-slate-800 px-1.5 py-0.2 rounded shrink-0">
                    {folder.files.length}
                  </span>
                  <ChevronRight className="w-3 h-3 opacity-60 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Create virtual folder inside logical drive */}
        <form onSubmit={handleCreateFolder} className="flex gap-1.5 items-center">
          <input
            type="text"
            id="new-folder-input"
            placeholder="New folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 p-1.5 rounded border border-white/10 bg-slate-950/40 text-slate-300 outline-none placeholder:text-slate-500"
          />
          <button
            type="submit"
            id="create-folder-btn"
            className="aero-button aero-button-aqua px-3.5 py-1.5 text-xs flex items-center gap-1 hover:brightness-105 shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-950" /> Add
          </button>
        </form>
      </div>

      {/* Right side File Explorer view window */}
      <div className="flex-1 flex flex-col space-y-3">
        
        {/* Explorer Search & Address bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Address Bar */}
          <div className={`flex-1 flex items-center gap-2 px-2.5 py-1.5 rounded border text-[11px] font-mono leading-none
            ${isDarkMode ? 'bg-slate-950/40 border-white/5' : 'bg-white/45 border-slate-900/10'} shadow-inner
          `}>
            <Folder className="w-4 h-4 text-sky-400 shrink-0" />
            <input
              type="text"
              id="address-bar-input"
              value={exportPath}
              onChange={(e) => handleCustomPathChange(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-semibold text-slate-300 select-all"
              title="Custom Destination Path"
            />
            <span className="text-[9px] bg-sky-500/15 text-sky-400 font-bold px-1.5 py-0.5 rounded border border-sky-400/20 shrink-0 leading-none">EXPORT</span>
          </div>

          {/* Search Folder */}
          <div className="relative shrink-0 w-full sm:w-[150px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5" />
            <input
              type="text"
              id="search-folder-input"
              placeholder="Search directory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 rounded border border-white/10 bg-slate-950/40 text-slate-300 outline-none"
            />
          </div>
        </div>

        {/* File items list box */}
        <div className={`flex-1 border aero-scrollbar rounded overflow-hidden flex flex-col h-[200px] md:h-[235px]
          ${isDarkMode ? 'bg-slate-950/50 border-white/5' : 'bg-white/50 border-slate-900/10'} shadow-inner
        `}>
          
          {/* Header row */}
          <div className="grid grid-cols-12 gap-2 p-2 font-semibold uppercase text-[10px] tracking-wide border-b border-white/10 bg-slate-900/20 text-slate-400 select-none shrink-0">
            <span className="col-span-6 flex items-center gap-1">File Name</span>
            <span className="col-span-2 text-right">Size</span>
            <span className="col-span-2 text-center">Video Format</span>
            <span className="col-span-2 text-center">Status</span>
          </div>

          {/* List scroll container */}
          <div className="flex-1 overflow-y-auto aero-scrollbar p-1.5 space-y-1">
            {filteredFiles.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none space-y-1.5">
                <FileVideo className="w-10 h-10 text-slate-600 animate-pulse" />
                <span className="text-slate-400 font-medium">Directory is empty.</span>
                <p className="text-[10px] text-slate-500 max-w-[240px]">Completed video transcode processes will export completed codecs here.</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.name}
                  className="grid grid-cols-12 gap-2 p-1.5 rounded hover:bg-white/10 text-slate-300 group items-center transition-colors font-sans"
                >
                  {/* File name & Icon */}
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    <FileVideo className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="truncate font-semibold text-slate-200" title={file.name}>
                      {file.name}
                    </span>
                  </div>

                  {/* Byte size */}
                  <span className="col-span-2 text-right font-mono font-medium text-slate-400">
                    {file.size >= 1024 * 1024 
                      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
                      : `${(file.size / 1024).toFixed(0)} KB`}
                  </span>

                  {/* Bitrate & Resolution tags */}
                  <span className="col-span-2 text-center font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 rounded text-[9.5px] py-0.5 truncate uppercase">
                    {file.codec} / {file.resolution}
                  </span>

                  {/* Actions column / Clear */}
                  <div className="col-span-2 flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleDeleteFile(file.name)}
                      id={`delete-export-file-${file.name.replace(/\.\w+$/, '')}`}
                      className="p-1 rounded hover:bg-rose-500/15 hover:text-rose-400 text-slate-500 transition-colors cursor-pointer"
                      title="Delete Encoded File"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {/* Simulated download linking */}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Downloading virtual output file: "${file.name}" (${(file.size / (1024*1024)).toFixed(1)} MB WebM stream). Offline extraction successful!`);
                      }}
                      className="p-1 rounded hover:bg-sky-500/15 text-slate-500 hover:text-sky-400 transition-colors"
                      title="Download simulation file locally"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Directory bottom summaries */}
          <div className="p-2 border-t border-white/5 bg-slate-900/30 text-[10.5px] text-slate-400 flex justify-between font-medium items-center select-none shrink-0">
            <span>{filteredFiles.length} files inside partition</span>
            <span className="font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">Virtual free space: 742.6 GB available</span>
          </div>

        </div>

      </div>

    </div>
  );
};
