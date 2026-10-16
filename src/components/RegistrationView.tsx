'use client';

import React, { useState } from 'react';
import { User, Phone, Briefcase, Lock, CheckCircle2, AlertCircle, ArrowLeft, Sparkles, Loader2, Database } from 'lucide-react';
import { CameraViewfinder } from './CameraViewfinder';
import { BiometricFrameResult, UserProfile } from '@/lib/types';
import { registerProfile } from '@/app/actions';
import { playSuccessChime, playWarningTone } from '@/lib/audio';
import confetti from 'canvas-confetti';

interface RegistrationViewProps {
  onReturnToMenu: () => void;
  onProfileRegistered: (profile: Partial<UserProfile>) => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onReturnToMenu,
  onProfileRegistered,
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [jobPost, setJobPost] = useState('GIS Spatial Intelligence Officer');

  const [currentFrame, setCurrentFrame] = useState<BiometricFrameResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<Partial<UserProfile> | null>(null);

  const handleFrameResult = (result: BiometricFrameResult) => {
    setCurrentFrame(result);
  };

  // Validation checks
  const canCapture =
    name.trim().length > 1 &&
    contact.trim().length > 3 &&
    jobPost.trim().length > 1 &&
    currentFrame?.detected &&
    currentFrame?.faceCount === 1 &&
    currentFrame?.quality.isOptimal &&
    currentFrame?.embedding &&
    currentFrame?.embedding.length === 128 &&
    !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentFrame?.embedding || currentFrame.embedding.length !== 128) {
      setErrorMessage('No valid face landmark features detected in current video frame.');
      playWarningTone();
      return;
    }

    if (currentFrame.faceCount !== 1) {
      setErrorMessage('Single-face guardrail violation: Ensure strictly 1 person is in the frame.');
      playWarningTone();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerProfile({
        name: name.trim(),
        contact: contact.trim(),
        jobPost: jobPost.trim(),
        faceEmbedding: currentFrame.embedding,
        photoUrl: currentFrame.faceSnapshot,
      });

      if (res.success && res.profile) {
        playSuccessChime();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06b6d4', '#10b981', '#3b82f6'],
        });
        setSuccessData(res.profile);
        onProfileRegistered(res.profile);
      } else {
        setErrorMessage(res.error || 'Failed to save encrypted profile.');
        playWarningTone();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network exception occurred during registration.');
      playWarningTone();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setName('');
    setContact('');
    setSuccessData(null);
    setErrorMessage(null);
  };

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header with Back button */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onReturnToMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-mono transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>Return to Menu</span>
        </button>
        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-700 dark:text-cyan-400 font-semibold">
          <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>AES-256-GCM Hardware Encrypted</span>
        </div>
      </div>

      {successData ? (
        /* Success Screen */
        <div className="max-w-2xl mx-auto bg-white/95 dark:bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 sm:p-8 text-center shadow-xl dark:shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300 transition-colors">
          {/* Captured Employee Face Portrait Identity */}
          {successData.photo_url ? (
            <div className="relative mx-auto w-24 h-24 mb-4 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl shadow-emerald-500/20 bg-slate-950">
              <img
                src={successData.photo_url}
                alt={successData.name || 'Personnel'}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-emerald-600/90 py-0.5 text-[9px] font-mono text-white text-center font-bold">
                ENROLLED ID
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono mb-2 font-semibold">
            BIOMETRIC IDENTITY ENROLLED
          </span>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">{successData.name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-6">
            {successData.job_post} • Profile UUID: {successData.id?.slice(0, 8)}...
          </p>

          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-left font-mono text-xs text-slate-700 dark:text-slate-300 space-y-2 mb-6">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Official Face Portrait:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Stored &amp; Encrypted in DB</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Biometric Vector:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">128-d Morphometric Distance Matrix</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Cipher Protocol:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">AES-256-GCM (12-byte IV)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Database Storage:</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">Supabase PostgreSQL + RLS</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleResetForNext}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              Register Another Personnel
            </button>
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Go to Menu Panel
            </button>
          </div>
        </div>
      ) : (
        /* Responsive Desktop Two-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Live Camera & Biometric Feature Vector (7 cols on lg/xl) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            {/* Live Camera Viewfinder */}
            <CameraViewfinder
              onFrameResult={handleFrameResult}
              overlayTitle="Registration Camera Feed"
              isScanning={true}
              className="w-full"
            />

            {/* Biometric Feature Vector Visualizer */}
            {currentFrame?.detected && currentFrame.embedding && (
              <div className="bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 backdrop-blur-md transition-colors">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 mb-1.5">
                  <span className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>128-d Biometric Feature Vector (Live WASM Extraction)</span>
                  </span>
                  <span>Norm: 1.00 (L2)</span>
                </div>
                <div className="grid grid-cols-32 gap-0.5 h-4 w-full bg-slate-100 dark:bg-slate-950 rounded p-1 overflow-hidden">
                  {currentFrame.embedding.slice(0, 32).map((val, idx) => {
                    const heightPct = Math.min(100, Math.max(10, Math.abs(val) * 350));
                    return (
                      <div
                        key={idx}
                        className="bg-cyan-500 rounded-t-xs"
                        style={{ height: `${heightPct}%` }}
                        title={`Dim ${idx}: ${val.toFixed(3)}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-Time Guardrails Strip on Desktop */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs">
              <div
                className={`flex items-center gap-1.5 ${
                  currentFrame?.faceCount === 1 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentFrame?.faceCount === 1 ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>Single Person</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  currentFrame?.liveness.isLive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentFrame?.liveness.isLive ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>Liveness Check</span>
              </div>
              <div
                className={`flex items-center gap-1.5 ${
                  currentFrame?.quality.isOptimal ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    currentFrame?.quality.isOptimal ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span>Optimal Lighting</span>
              </div>
            </div>
          </div>

          {/* Right Column: Personnel Form & Security Info (5 cols on lg/xl) */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            {/* Form Card: Initialize input Function */}
            <form
              onSubmit={handleSubmit}
              className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-md space-y-4 transition-colors"
            >
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                  Algorithm Step: Initialize input Function
                </span>
                <span className="text-[10px] font-mono text-slate-500">Step 1 of 3</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Initialize Input Function</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Provide employee details before initializing face capturing
              </p>
            </div>

            {/* Official Face Identity Portrait Badge */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-900 border-2 border-cyan-500/40 shrink-0 flex items-center justify-center relative shadow-sm">
                {currentFrame?.faceSnapshot ? (
                  <img
                    src={currentFrame.faceSnapshot}
                    alt="Live Face Snapshot"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-7 h-7 text-slate-400 animate-pulse" />
                )}
                {currentFrame?.faceSnapshot && (
                  <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-mono text-center font-bold py-0.5">
                    CAPTURED
                  </div>
                )}
              </div>
              <div className="text-xs font-mono space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                  <span>Initialize Face Capturing Function</span>
                  {currentFrame?.faceSnapshot ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                      Face Captured
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">
                      Align Face in Oval
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans leading-tight">
                  {currentFrame?.faceSnapshot
                    ? 'Official facial identity extracted and ready to push to database.'
                    : 'Camera captures 128-d biometric landmark vector for identity.'}
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3.5">
              {/* 1. Name */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 font-semibold flex items-center justify-between">
                  <span>1. Name <span className="text-cyan-600 dark:text-cyan-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Full Name of Employee</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    inputMode="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Commander Vikram Rathore"
                    className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
                  />
                </div>
              </div>

              {/* 2. Contact no. */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 font-semibold flex items-center justify-between">
                  <span>2. Contact no. <span className="text-cyan-600 dark:text-cyan-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Phone / Mobile</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
                  />
                </div>
              </div>

              {/* 3. Job Profile */}
              <div>
                <label className="block text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 font-semibold flex items-center justify-between">
                  <span>3. Job Profile <span className="text-cyan-600 dark:text-cyan-400">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Designation / Role</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={jobPost}
                    onChange={(e) => setJobPost(e.target.value)}
                    list="job-profiles-list"
                    placeholder="e.g. GIS Spatial Intelligence Officer"
                    className="w-full min-h-[46px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-sans shadow-inner"
                  />
                  <datalist id="job-profiles-list">
                    <option value="GIS Spatial Intelligence Officer" />
                    <option value="Biometric Security Architect" />
                    <option value="Remote Sensing Analyst" />
                    <option value="Mission Ops Field Coordinator" />
                    <option value="Cyber Systems Administrator" />
                    <option value="Enterprise Operations Staff" />
                  </datalist>
                </div>
              </div>
            </div>

            {/* Submit Button: Push to database */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canCapture}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-xl cursor-pointer ${
                  canCapture
                    ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-cyan-500/20 active:scale-[0.99]'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Pushing to Database...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>
                      {currentFrame?.detected
                        ? 'Push to Database'
                        : 'Align Face in Viewfinder First'}
                    </span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-500 font-mono mt-2">
                Algorithm Step 3: Encrypts 128-d Vector &amp; Pushes to Database
              </p>
            </div>
          </form>

          {/* Desktop Security Info Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
              <span>Hardware Encryption:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-bold">AES-256-GCM (12-byte IV)</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
              <span>Vector Feature Resolution:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">128-d L2 Normalized</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-[11px]">
              <span>Database Persistence:</span>
              <span className="text-purple-600 dark:text-purple-400 font-bold">Supabase PostgreSQL RLS</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
};
