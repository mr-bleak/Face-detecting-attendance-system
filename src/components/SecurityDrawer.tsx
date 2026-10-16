'use client';

import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Cpu, Clock, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SecurityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityDrawer: React.FC<SecurityDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-cyan-500/30 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                CYBER DEFENSE &amp; CRYPTOGRAPHY
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Blueprint Architecture Security Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Specs Grid */}
        <div className="space-y-4 text-xs font-mono">
          {/* Layer 1: Biometric & PII Confidentiality */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-bold">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Layer 1: Biometric &amp; PII Confidentiality</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
              Personal identifiable information (Name, Contact No.) and 128-d biometric feature arrays are strictly encrypted on the server before database persistence.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 block">Cipher Protocol:</span>
                <span className="text-slate-900 dark:text-white font-semibold">AES-256-GCM</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 block">IV / Tag:</span>
                <span className="text-slate-900 dark:text-white font-semibold">96-bit IV + 128-bit Tag</span>
              </div>
            </div>
          </div>

          {/* Layer 2: Tampering & Replay Prevention */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <Key className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Layer 2: Anti-Replay &amp; Cryptographic Signatures</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
              Every marked attendance event requires an immutable HMAC-SHA256 signature generated across <code>userId + timestamp + nonce</code>.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 block">Max Drift Ceiling:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">&le; 5000 ms</span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800/80">
                <span className="text-slate-500 block">Nonce Invalidation:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">One-Time Use (LRU Cache)</span>
              </div>
            </div>
          </div>

          {/* Layer 3: Database & Cloud Isolation */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold">
              <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Layer 3: Storage &amp; Database State</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400">Database Engine:</span>
              <span className="text-slate-900 dark:text-white font-semibold">Supabase PostgreSQL (RLS Enabled)</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-slate-400">Active Mode:</span>
              <span
                className={`px-2 py-0.5 rounded font-bold ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/40'
                }`}
              >
                {isSupabaseConfigured ? 'Supabase Live Connected' : 'Resilient Zero-Config Memory DB'}
              </span>
            </div>
          </div>

          {/* Layer 4: Client WASM Engine */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
              <Cpu className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Layer 4: Zero Python / Client-Side WASM</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-[11px] font-sans">
              Google MediaPipe WebAssembly FaceLandmarker runs in-browser (GPU/WASM) with 160ms throttled frame cadence to maintain 30-60 FPS on Android with zero cloud compute costs.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            Close Security Audit
          </button>
        </div>
      </div>
    </div>
  );
};
