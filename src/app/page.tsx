'use client';

import React, { useState, useEffect } from 'react';
import { NavigationMenu } from '@/components/NavigationMenu';
import { RegistrationView } from '@/components/RegistrationView';
import { MarkAttendanceView } from '@/components/MarkAttendanceView';
import { ShowAttendanceView } from '@/components/ShowAttendanceView';
import { SecurityDrawer } from '@/components/SecurityDrawer';
import { ClearDatabaseModal } from '@/components/ClearDatabaseModal';
import { OperationalMode, UserProfile, AttendanceRecord } from '@/lib/types';
import { fetchAllProfiles, fetchAttendanceLogs } from '@/app/actions';
import {
  ScanFace,
  UserPlus,
  FileSpreadsheet,
  ChevronRight,
  Activity,
  ShieldCheck,
  Lock,
  Zap,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  ArrowUpRight,
  Radio,
  Fingerprint,
} from 'lucide-react';

export default function Home() {
  const [mode, setMode] = useState<OperationalMode>('MENU');
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  // Load registered profiles and attendance records
  const loadData = async () => {
    try {
      const [fetchedProfiles, fetchedLogs] = await Promise.all([
        fetchAllProfiles(),
        fetchAttendanceLogs(),
      ]);
      setProfiles(fetchedProfiles);
      setAttendanceLogs(fetchedLogs);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const [todayDateStr, setTodayDateStr] = useState<string>('');

  useEffect(() => {
    setTodayDateStr(new Date().toDateString());
    loadData();
  }, []);

  const handleProfileRegistered = (newProfile: Partial<UserProfile>) => {
    loadData();
  };

  const handleAttendanceMarked = (newRecord: AttendanceRecord) => {
    setAttendanceLogs((prev) => [newRecord, ...prev]);
  };

  const handleDataCleared = () => {
    setProfiles([]);
    setAttendanceLogs([]);
    loadData();
  };

  // Today's attendance calculation (computed once todayDateStr is mounted)
  const todayRecords = todayDateStr
    ? attendanceLogs.filter(
        (log) => new Date(log.timestamp).toDateString() === todayDateStr
      )
    : [];
  const attendanceRate =
    profiles.length > 0 ? Math.min(100, Math.round((todayRecords.length / profiles.length) * 100)) : 0;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-300 relative overflow-x-hidden">
      {/* Background Cyber & Glass Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-[550px] h-[550px] bg-gradient-to-br from-cyan-500/15 to-blue-600/10 dark:from-cyan-500/20 dark:to-blue-600/10 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-500/15 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/10 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute -bottom-40 left-1/4 w-[650px] h-[650px] bg-gradient-to-tr from-purple-500/15 to-pink-500/10 dark:from-purple-500/20 dark:to-pink-500/10 rounded-full blur-[160px] animate-pulse-glow" style={{ animationDelay: '3s' }} />
        {/* Subtle dynamic grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />
      </div>

      <div className="relative z-10 flex-1">
        {/* Top Header Bar */}
        <NavigationMenu
          currentMode={mode}
          onSelectMode={(selectedMode) => setMode(selectedMode)}
          registeredCount={profiles.length}
          todayAttendanceCount={todayRecords.length}
          onOpenSecurityModal={() => setSecurityModalOpen(true)}
          onOpenClearModal={() => setClearModalOpen(true)}
        />

        {/* View Switcher */}
        {mode === 'REGISTER' && (
          <RegistrationView
            onReturnToMenu={() => setMode('MENU')}
            onProfileRegistered={handleProfileRegistered}
          />
        )}

        {mode === 'MARK_ATTENDANCE' && (
          <MarkAttendanceView
            profiles={profiles}
            attendanceLogs={attendanceLogs}
            onReturnToMenu={() => setMode('MENU')}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}

        {mode === 'SHOW_ATTENDANCE' && (
          <ShowAttendanceView
            logs={attendanceLogs}
            onReturnToMenu={() => setMode('MENU')}
            onRefreshLogs={loadData}
            onOpenClearModal={() => setClearModalOpen(true)}
          />
        )}

        {mode === 'MENU' && (
          /* Glassmorphic Menu Panel & Operation Hub */
          <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pb-14 space-y-8 animate-fadeIn">
            {/* 1. Hero Glass Command Center */}
            <div className="glass-surface rounded-3xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
              {/* Internal decorative radial lighting */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 dark:bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-xs">
                      <Radio className="w-3 h-3 text-cyan-500 animate-pulse" />
                      <span>GIS BIOMETRIC COMMAND HUB</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                      <span>ENGINE ONLINE</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-purple-700 dark:text-purple-400 bg-purple-500/10 border border-purple-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      <span>AES-256 + HMAC-SHA256</span>
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono flex items-center gap-3">
                    <span>OPERATIONAL HUB</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    Zero-server-latency face verification platform powered by MediaPipe WebAssembly. Operates strictly inside the client runtime with automated anti-spoofing and single-check-in daily protection.
                  </p>
                </div>

                {/* Quick Security Status Capsule */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                  <div className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Daily Constraint:</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      1 Mark / Day Strict
                    </span>
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span className="text-xs font-mono text-slate-600 dark:text-slate-400">Match Threshold:</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      89% &ndash; 100% Match Gate
                    </span>
                  </div>
                </div>
              </div>

              {/* 4 Interactive Glass Telemetry KPI Tiles */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
                {/* Stat Tile 1 */}
                <div className="glass-stat-tile rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-mono font-medium">Registered Staff</span>
                    <Users className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {profiles.length}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-sans">
                    <span>128-d encrypted identities</span>
                  </div>
                </div>

                {/* Stat Tile 2 */}
                <div className="glass-stat-tile rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-mono font-medium">Today&apos;s Present</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    {todayRecords.length}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-sans">
                    <span>{attendanceRate}% organization rate</span>
                  </div>
                </div>

                {/* Stat Tile 3 */}
                <div className="glass-stat-tile rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-mono font-medium">Model Precision</span>
                    <Cpu className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-purple-600 dark:text-purple-400">
                    478
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-sans">
                    <span>3D WASM Mesh Landmarks</span>
                  </div>
                </div>

                {/* Stat Tile 4 */}
                <div className="glass-stat-tile rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                    <span className="text-xs font-mono font-medium">Anti-Tamper</span>
                    <Lock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                    100%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 font-sans">
                    <span>HMAC-SHA256 signature</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. The 3 Master Operational Branch Cards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 font-bold flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-500" />
                  <span>CORE OPERATIONAL BRANCHES</span>
                </h2>
                <span className="text-[11px] font-mono text-slate-400">
                  Select a gateway to execute
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
                {/* Branch 01: Create Account */}
                <div
                  onClick={() => setMode('REGISTER')}
                  className="glass-card rounded-3xl p-6 lg:p-7 relative overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  {/* Subtle top shimmer sweep on hover */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />

                  {/* Corner ambient glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-md group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:text-slate-950 transition-all duration-300 group-hover:scale-105">
                        <UserPlus className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/30 uppercase tracking-wider">
                        BRANCH 01
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                        Biometric Enrollment
                      </div>
                      <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                        Create Account
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                        Capture official biometric identity (Name, Contact, Job Profile) via hardware webcam. Synthesizes a 128-dimensional facial embedding and stores it with AES-256-GCM authenticated encryption.
                      </p>
                    </div>

                    {/* Technical Pills */}
                    <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        128-d Vector
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        AES-256-GCM
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Anti-Ghosting
                      </span>
                    </div>
                  </div>

                  {/* Interactive Button Bar */}
                  <div className="pt-6 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    <span className="group-hover:underline">Launch Enrollment Station</span>
                    <div className="w-7 h-7 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:text-slate-950 transition-colors">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Branch 02: Mark Attendance */}
                <div
                  onClick={() => setMode('MARK_ATTENDANCE')}
                  className="glass-card rounded-3xl p-6 lg:p-7 relative overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  {/* Subtle top shimmer sweep on hover */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />

                  {/* Corner ambient glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-md group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-slate-950 transition-all duration-300 group-hover:scale-105">
                        <ScanFace className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                        BRANCH 02
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                        Biometric Verification
                      </div>
                      <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        Mark Attendance
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                        Autonomous face scanning radar with 89% &ndash; 100% biometric similarity validation. Rejects unrecognized strangers, verifies liveness, and enforces strictly 1 attendance check-in per day per employee.
                      </p>
                    </div>

                    {/* Technical Pills */}
                    <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        1 Mark / Day Strict
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Liveness Blink Gate
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        1.5s Auto-Lock
                      </span>
                    </div>
                  </div>

                  {/* Interactive Button Bar */}
                  <div className="pt-6 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="group-hover:underline">Activate Attendance Radar</span>
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-slate-950 transition-colors">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Branch 03: Show Attendance */}
                <div
                  onClick={() => setMode('SHOW_ATTENDANCE')}
                  className="glass-card rounded-3xl p-6 lg:p-7 relative overflow-hidden cursor-pointer group flex flex-col justify-between"
                >
                  {/* Subtle top shimmer sweep on hover */}
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent -translate-x-full group-hover:translate-x-full transform transition-transform duration-1000" />

                  {/* Corner ambient glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/15 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-md group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 group-hover:scale-105">
                        <FileSpreadsheet className="w-7 h-7" />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/30 uppercase tracking-wider">
                        BRANCH 03
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-mono uppercase tracking-wider text-purple-600 dark:text-purple-400 font-semibold mb-1">
                        Audit &amp; Intelligence
                      </div>
                      <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">
                        Show Attendance
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-sans mt-2 leading-relaxed">
                        Audit cryptographic check-in records. Inspect verified employee snapshot, exact timestamp, biometric score, and HMAC-SHA256 anti-tamper signature with CSV export.
                      </p>
                    </div>

                    {/* Technical Pills */}
                    <div className="pt-2 flex flex-wrap gap-1.5 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        HMAC Audit Proof
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        Live Photo Log
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        CSV Export Ready
                      </span>
                    </div>
                  </div>

                  {/* Interactive Button Bar */}
                  <div className="pt-6 mt-4 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                    <span className="group-hover:underline">Open Audit Ledger</span>
                    <div className="w-7 h-7 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Live Activity Stream (Glassmorphism Live Feed) */}
            <div className="glass-surface rounded-3xl p-5 sm:p-6 transition-all duration-300">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/80 dark:border-slate-800/80 text-xs font-mono">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold tracking-wider uppercase">
                    Live Verified Attendance Stream
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                    {attendanceLogs.length} Total Logs
                  </span>
                </div>
                <button
                  onClick={() => setMode('SHOW_ATTENDANCE')}
                  className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Full Ledger</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {attendanceLogs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
                  {attendanceLogs.slice(0, 3).map((log) => (
                    <div
                      key={log.id}
                      className="glass-card rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs font-mono"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {log.photo_url ? (
                          <img
                            src={log.photo_url}
                            alt={log.user_name || 'Staff'}
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 shrink-0 shadow-xs"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                            <Fingerprint className="w-5 h-5 text-emerald-500" />
                          </div>
                        )}
                        <div className="min-w-0 truncate">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {log.user_name || 'Enrolled Personnel'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {log.job_post || 'GIS Analyst'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end shrink-0">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                          {(log.verification_score * 100).toFixed(1)}% Match
                        </span>
                        <span className="text-slate-400 text-[10px] mt-1">
                          {new Date(log.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center font-mono space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                    <ScanFace className="w-6 h-6 text-slate-400 animate-pulse" />
                  </div>
                  <div className="text-xs text-slate-500">
                    No verified check-ins recorded yet today.
                  </div>
                  <button
                    onClick={() => setMode('MARK_ATTENDANCE')}
                    className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    Start Face Detection Radar &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* 4. Enterprise Architecture & Security Assurance Strip */}
            <div className="glass-surface rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero Raw-Image Server Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-500" />
                <span>Client-Side WASM 478-Landmark Radar</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                <span>AES-256-GCM + HMAC-SHA256 Cryptography</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Strict 1 Attendance Per Day Check</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cyber Defense Modal */}
      <SecurityDrawer isOpen={securityModalOpen} onClose={() => setSecurityModalOpen(false)} />

      {/* Clear All Database Data Confirmation Modal */}
      <ClearDatabaseModal
        isOpen={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onDataCleared={handleDataCleared}
      />

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-900 py-4 px-4 text-center text-xs font-mono text-slate-500 bg-white/90 dark:bg-slate-950/90 transition-colors duration-300">
        <p>
          SmartFace Attendance System • GIS &amp; Cyber Defense Engine • TypeScript + WASM + Supabase + Vercel
        </p>
      </footer>
    </main>
  );
}
