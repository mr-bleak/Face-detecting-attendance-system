'use client';

import React from 'react';
import { UserPlus, ScanFace, FileSpreadsheet, ShieldCheck, Cpu, Database, Sun, Moon, Trash2, ArrowLeft } from 'lucide-react';
import { OperationalMode } from '@/lib/types';
import { useTheme } from '@/lib/theme';

interface NavigationMenuProps {
  currentMode: OperationalMode;
  onSelectMode: (mode: OperationalMode) => void;
  registeredCount: number;
  todayAttendanceCount: number;
  onOpenSecurityModal: () => void;
  onOpenClearModal: () => void;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  currentMode,
  onSelectMode,
  registeredCount,
  todayAttendanceCount,
  onOpenSecurityModal,
  onOpenClearModal,
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
      {/* Top Header / Cyber HUD Bar */}
      <div className="glass-surface rounded-3xl p-4 sm:p-5 lg:px-6 mb-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div
            onClick={() => onSelectMode('MENU')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ScanFace className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                  SMARTFACE <span className="text-cyan-600 dark:text-cyan-400">ENGINE</span>
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                  GIS v4.2
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Zero Python • Pure WASM Biometric Ingestion &amp; Cyber-Defense
              </p>
            </div>
          </div>

          {/* Controls: Theme Switcher, Clear DB, Security, & Stats */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono w-full sm:w-auto justify-start sm:justify-end pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-800/60 sm:border-t-0">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 dark:bg-slate-800/80 dark:hover:bg-slate-750 transition-all cursor-pointer font-semibold shadow-sm active:scale-95"
              title={`Switch to ${theme === 'dark' ? 'Bright / Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bright</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span>Dark</span>
                </>
              )}
            </button>

            {/* Clear Database Button */}
            <button
              onClick={onOpenClearModal}
              className="flex items-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 transition-all cursor-pointer font-semibold active:scale-95 shadow-sm"
              title="Delete all registered profiles and attendance records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear DB</span>
            </button>

            {/* Security Audit Badge */}
            <button
              onClick={onOpenSecurityModal}
              className="flex items-center gap-1.5 px-2.5 py-2 min-h-[36px] rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-750 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer active:scale-95"
              title="Click to view Security & Cryptography audit"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="hidden xs:inline sm:inline">AES-256 + HMAC</span>
            </button>

            {/* Profiles Count Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-2 min-h-[36px] rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{registeredCount} Profiles</span>
            </div>
          </div>
        </div>

        {/* 
          Note: As requested, the 3 duplicate action buttons are REMOVED from the Menu Page header!
          When navigating inside sub-views (REGISTER, MARK_ATTENDANCE, SHOW_ATTENDANCE), a compact breadcrumb / tab bar allows quick switching.
        */}
        {currentMode !== 'MENU' && (
          <div className="flex flex-col xs:flex-row sm:flex-row items-stretch xs:items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={() => onSelectMode('MENU')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[36px] rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer font-semibold active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-500" />
              <span>Return to Menu</span>
            </button>

            <div className="flex items-center justify-center gap-1 overflow-x-auto py-0.5">
              <button
                onClick={() => onSelectMode('REGISTER')}
                className={`px-3 py-2 min-h-[36px] rounded-xl transition-all cursor-pointer font-semibold active:scale-95 ${
                  currentMode === 'REGISTER'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                1. Register
              </button>
              <button
                onClick={() => onSelectMode('MARK_ATTENDANCE')}
                className={`px-3 py-2 min-h-[36px] rounded-xl transition-all cursor-pointer font-semibold active:scale-95 ${
                  currentMode === 'MARK_ATTENDANCE'
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                2. Mark Attendance
              </button>
              <button
                onClick={() => onSelectMode('SHOW_ATTENDANCE')}
                className={`px-3 py-2 min-h-[36px] rounded-xl transition-all cursor-pointer font-semibold active:scale-95 ${
                  currentMode === 'SHOW_ATTENDANCE'
                    ? 'bg-purple-500 text-white font-bold shadow-md shadow-purple-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                3. Logs ({todayAttendanceCount})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
