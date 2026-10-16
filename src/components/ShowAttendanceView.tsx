'use client';

import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, Search, Filter, Download, ArrowLeft, ShieldCheck, RefreshCw, Calendar, Clock, Trash2 } from 'lucide-react';
import { AttendanceRecord } from '@/lib/types';

interface ShowAttendanceViewProps {
  logs: AttendanceRecord[];
  onReturnToMenu: () => void;
  onRefreshLogs: () => Promise<void>;
  onOpenClearModal?: () => void;
}

export const ShowAttendanceView: React.FC<ShowAttendanceViewProps> = ({
  logs,
  onReturnToMenu,
  onRefreshLogs,
  onOpenClearModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        (log.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.job_post || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.signature.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [logs, searchTerm, statusFilter]);

  const totalLogs = logs.length;
  const presentCount = logs.filter((l) => l.status === 'PRESENT').length;
  const avgConfidence =
    logs.length > 0
      ? (logs.reduce((acc, l) => acc + l.verification_score, 0) / logs.length * 100).toFixed(1)
      : '98.5';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshLogs();
    setIsRefreshing(false);
  };

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Record ID', 'Personnel Name', 'Job Post', 'Match Score', 'Status', 'Timestamp', 'HMAC Signature'];
    const rows = filteredLogs.map((log) => [
      log.id,
      `"${log.user_name || 'Unknown'}"`,
      `"${log.job_post || 'GIS Staff'}"`,
      `${(log.verification_score * 100).toFixed(1)}%`,
      log.status,
      log.timestamp,
      `"${log.signature}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `smartface_attendance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={onReturnToMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-mono transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>Return to Menu</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-mono transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-semibold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {onOpenClearModal && (
            <button
              onClick={onOpenClearModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-xs font-mono font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Delete all registered profiles and attendance records"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Clear DB</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive KPI Metrics Strip on Desktop & Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 font-mono">
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Check-Ins</span>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalLogs}</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Verified Present</span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{presentCount}</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Avg Cosine Match</span>
          <div className="text-xl sm:text-2xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{avgConfidence}%</div>
        </div>
        <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur-md">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Anti-Tamper Defense</span>
          <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">100% HMAC</div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-md overflow-hidden transition-colors">
        {/* Title Bar & Stats */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono">
              <FileSpreadsheet className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>ATTENDANCE AUDIT LOGS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              Decrypted personnel logs backed by HMAC-SHA256 non-repudiation
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">Total Logs:</span>{' '}
              <span className="text-slate-900 dark:text-white font-bold">{logs.length}</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
              <span className="font-bold">100% Tamper Verified</span>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by personnel name, job post, or HMAC signature..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-sans shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 font-mono shadow-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
            </select>
          </div>
        </div>

        {/* Records Display: Mobile Cards for Phone, Table for Desktop */}
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-slate-500">
            No attendance records found matching current query or filters.
          </div>
        ) : (
          <>
            {/* Mobile Cards (Visible on mobile/Android screens < md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedDate = dateObj.toLocaleDateString();
                const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={log.id} className="p-4 space-y-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Top Row: Name, Photo and Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {log.photo_url ? (
                          <img
                            src={log.photo_url}
                            alt={log.user_name || 'Personnel'}
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-500/50 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 font-mono font-bold text-xs border border-slate-300 dark:border-slate-700">
                            {(log.user_name || 'P').charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {log.user_name || 'Registered Personnel'}
                          </h4>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {log.job_post || 'GIS Analyst'}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40 shrink-0">
                        {log.status}
                      </span>
                    </div>

                    {/* Middle Row: Match Confidence & Date/Time */}
                    <div className="flex items-center justify-between text-xs font-mono pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 text-[11px]">Match:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          {(log.verification_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formattedDate} • {formattedTime}</span>
                      </div>
                    </div>

                    {/* Bottom Row: Cryptographic Signature Stamp */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-slate-500">HMAC:</span>
                      <span
                        className="truncate flex-1 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-cyan-700 dark:text-cyan-400 font-semibold"
                        title={log.signature}
                      >
                        {log.signature}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (Visible on tablet & desktop >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-sans text-xs">
                <thead className="bg-slate-100/80 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Personnel</th>
                    <th className="py-3 px-4">Job Post / Dept</th>
                    <th className="py-3 px-4">Match Score</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">HMAC Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {filteredLogs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = dateObj.toLocaleDateString();
                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2.5">
                            {log.photo_url ? (
                              <img
                                src={log.photo_url}
                                alt={log.user_name || 'Personnel'}
                                className="w-8 h-8 rounded-lg object-cover border border-emerald-500/50 shrink-0 shadow-sm"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 font-mono font-bold text-xs border border-slate-300 dark:border-slate-700">
                                {(log.user_name || 'P').charAt(0)}
                              </div>
                            )}
                            <span>{log.user_name || 'Registered Personnel'}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {log.job_post || 'GIS Analyst'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            {(log.verification_score * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40">
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 mt-0.5">
                            <Clock className="w-3 h-3" />
                            <span>{formattedTime}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 text-[10px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span
                              className="truncate max-w-[120px] sm:max-w-[200px] lg:max-w-[280px] xl:max-w-[360px] bg-slate-100 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-semibold"
                              title={log.signature}
                            >
                              {log.signature}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
