'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Loader2,
  Play,
  User,
  ShieldAlert,
  RotateCcw,
  Clock,
  Calendar,
  Database,
  Check,
  Lock,
} from 'lucide-react';
import { CameraViewfinder } from './CameraViewfinder';
import { BiometricFrameResult, UserProfile, AttendanceRecord } from '@/lib/types';
import { computeCosineSimilarity } from '@/lib/faceEngine';
import { createAttendanceToken, verifyAndMarkAttendance } from '@/app/actions';
import { playSuccessChime, playWarningTone } from '@/lib/audio';
import confetti from 'canvas-confetti';

interface MarkAttendanceViewProps {
  profiles: UserProfile[];
  attendanceLogs: AttendanceRecord[];
  onReturnToMenu: () => void;
  onAttendanceMarked: (record: AttendanceRecord) => void;
}

export const MarkAttendanceView: React.FC<MarkAttendanceViewProps> = ({
  profiles,
  attendanceLogs,
  onReturnToMenu,
  onAttendanceMarked,
}) => {
  const [isScanningActive, setIsScanningActive] = useState(true);

  const [currentFrame, setCurrentFrame] = useState<BiometricFrameResult | null>(null);
  const [bestMatch, setBestMatch] = useState<{ profile: UserProfile; similarity: number } | null>(null);
  const [candidateScore, setCandidateScore] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastMarkedRecord, setLastMarkedRecord] = useState<AttendanceRecord | null>(null);

  // Live real-time clock for "current date & time"
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);
  useEffect(() => {
    setCurrentDateTime(new Date());
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if recognized employee has already marked attendance today (strictly 1 attendance per day)
  const todayDateStr = currentDateTime ? currentDateTime.toDateString() : '';
  const existingTodayRecord = bestMatch && todayDateStr
    ? attendanceLogs.find(
        (log) =>
          log.user_id === bestMatch.profile.id &&
          new Date(log.timestamp).toDateString() === todayDateStr
      )
    : null;

  // Auto-mark option & countdown timer
  const [autoMarkEnabled, setAutoMarkEnabled] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Biometric matching logic: Compares candidate face strictly against registered employees
  const handleFrameResult = useCallback(
    async (result: BiometricFrameResult) => {
      setCurrentFrame(result);

      if (!isScanningActive || isSubmitting || lastMarkedRecord) return;
      if (!result.detected || result.faceCount !== 1 || !result.embedding) {
        setBestMatch(null);
        setCandidateScore(null);
        return;
      }

      if (profiles.length === 0) {
        setBestMatch(null);
        setCandidateScore(null);
        return;
      }

      // Compute biometric identity similarity against all registered personnel
      let topProfile: UserProfile | null = null;
      let highestSimilarity = -1;

      for (const profile of profiles) {
        if (!profile.face_embedding || profile.face_embedding.length !== 128) continue;
        const sim = computeCosineSimilarity(result.embedding, profile.face_embedding);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          topProfile = profile;
        }
      }

      // Strict biometric recognition threshold: 89% to 100% (0.89 <= similarity <= 1.00)
      // Strangers typically score below 80%, while enrolled employees score 89% to 100%
      if (topProfile && highestSimilarity >= 0.89 && highestSimilarity <= 1.0) {
        setBestMatch({ profile: topProfile, similarity: highestSimilarity });
        setCandidateScore(highestSimilarity);
      } else {
        setBestMatch(null);
        setCandidateScore(highestSimilarity > 0 ? highestSimilarity : null);
      }
    },
    [isScanningActive, isSubmitting, lastMarkedRecord, profiles]
  );

  const triggerMarkAttendance = async (profile: UserProfile, similarity: number) => {
    if (isSubmitting) return;

    if (!bestMatch) {
      setErrorMessage('Security Violation: Attendance cannot be marked for unregistered or unrecognized faces.');
      playWarningTone();
      return;
    }

    if (existingTodayRecord) {
      const timeStr = new Date(existingTodayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setErrorMessage(`Daily Limit: Attendance has already been marked today for ${profile.name} at ${timeStr}. Only 1 attendance per day is permitted.`);
      playWarningTone();
      return;
    }

    if (!currentFrame?.quality.isOptimal) {
      setErrorMessage('Image quality is suboptimal (check lighting or face blur) before marking.');
      playWarningTone();
      return;
    }

    if (!currentFrame?.liveness.isLive) {
      setErrorMessage('Liveness check not verified: Please blink or center your face.');
      playWarningTone();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Step 1: Request cryptographic nonce + server timestamp from Server Action
      const token = await createAttendanceToken(profile.id);

      // Step 2: Submit verified attendance record
      const res = await verifyAndMarkAttendance({
        userId: profile.id,
        verificationScore: similarity,
        status: 'PRESENT',
        timestamp: token.timestamp,
        nonce: token.nonce,
        signature: token.signature,
      });

      if (res.success && res.record) {
        const fullRecord: AttendanceRecord = {
          ...res.record,
          user_name: profile.name,
          job_post: profile.job_post,
          photo_url: profile.photo_url,
        };

        playSuccessChime();
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6'],
        });

        setLastMarkedRecord(fullRecord);
        onAttendanceMarked(fullRecord);
      } else {
        setErrorMessage(res.error || 'Attendance verification failed');
        playWarningTone();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network exception while logging attendance.');
      playWarningTone();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-mark effect: counts down and automatically marks attendance when a registered face is locked
  useEffect(() => {
    if (!autoMarkEnabled || !bestMatch || isSubmitting || lastMarkedRecord || existingTodayRecord) {
      setCountdown(null);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }

    let remaining = 1.5;
    setCountdown(remaining);

    countdownRef.current = setInterval(() => {
      remaining = Math.max(0, remaining - 0.5);
      setCountdown(Number(remaining.toFixed(1)));
      if (remaining <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        triggerMarkAttendance(bestMatch.profile, bestMatch.similarity);
      }
    }, 500);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [bestMatch?.profile.id, autoMarkEnabled, isSubmitting, lastMarkedRecord, existingTodayRecord]);

  const handleNextPerson = () => {
    setLastMarkedRecord(null);
    setBestMatch(null);
    setCandidateScore(null);
    setErrorMessage(null);
    setCountdown(null);
    setIsScanningActive(true);
  };

  // Flowchart 'Retry' function: loops back to Initialize Face Detection function
  const handleRetry = () => {
    setBestMatch(null);
    setCandidateScore(null);
    setErrorMessage(null);
    setCountdown(null);
    setIsScanningActive(false);
    setTimeout(() => {
      setIsScanningActive(true);
    }, 150);
  };

  const formattedDate = currentDateTime
    ? currentDateTime.toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';
  const formattedTime = currentDateTime
    ? currentDateTime.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '';

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
      {/* Header with Flowchart Indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <button
          onClick={onReturnToMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 text-xs font-mono transition-all cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Return to Menu Panel</span>
        </button>

        {/* Live Date & Time Stamp Display */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
            <span>{formattedDate}</span>
            <span className="text-slate-400">•</span>
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-bold text-slate-900 dark:text-white">{formattedTime}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-semibold shadow-inner">
            <ScanFace className="w-3.5 h-3.5 animate-pulse" />
            <span>Initialize Face Detection Function</span>
          </div>
        </div>
      </div>

      {lastMarkedRecord ? (
        /* Flowchart Box: Mark face detected employe's attendance for current date & time -> Push to database */
        <div className="max-w-2xl mx-auto bg-white/95 dark:bg-slate-900/90 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 text-center shadow-xl dark:shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-300 transition-colors">
          {/* Recognized Employee Official Face Portrait */}
          {lastMarkedRecord.photo_url ? (
            <div className="relative mx-auto w-24 h-24 mb-4 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl shadow-emerald-500/25 bg-slate-950">
              <img
                src={lastMarkedRecord.photo_url}
                alt={lastMarkedRecord.user_name || 'Personnel'}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[8px] font-mono text-center font-bold py-0.5">
                VERIFIED ID
              </div>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
          )}

          <div className="space-y-1 mb-3">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-mono font-semibold">
              Algorithm: Attendance Marked for Current Date &amp; Time
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">{lastMarkedRecord.user_name}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-6">{lastMarkedRecord.job_post}</p>

          <div className="bg-slate-50 dark:bg-slate-950/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-left font-mono text-xs text-slate-700 dark:text-slate-300 space-y-2.5 mb-6">
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Employee Face Match:</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {(lastMarkedRecord.verification_score * 100).toFixed(1)}% Biometric Match
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Current Date &amp; Time Marked:</span>
              <span className="text-slate-900 dark:text-white font-bold">
                {new Date(lastMarkedRecord.timestamp).toLocaleDateString()} • {new Date(lastMarkedRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
              <span className="text-slate-500">Algorithm Step:</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-semibold">Push to database (Completed)</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-slate-500">HMAC-SHA256 Anti-Tamper Signature:</span>
              <span className="text-[10px] text-cyan-700 dark:text-cyan-400 break-all font-mono bg-slate-100 dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                {lastMarkedRecord.signature}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onReturnToMenu}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Menu Panel</span>
            </button>
            <button
              onClick={handleNextPerson}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Scan Next Employee / Retry</span>
            </button>
          </div>
        </div>
      ) : (
        /* Responsive Desktop Two-Column Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Camera Viewfinder & Error Message (7 cols on lg/xl) */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            <CameraViewfinder
              onFrameResult={handleFrameResult}
              overlayTitle="Initialize Face Detection function"
              isScanning={isScanningActive}
              className="w-full"
            />

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Right Column: Flowchart Decision Loop < Face detected > */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            {/* Flowchart Decision Card */}
            <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl dark:shadow-2xl backdrop-blur-md transition-colors">
              <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Decision: &lt; Face detected &gt;</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {profiles.length} Registered in DB
                </span>
              </div>

              {/* Branch 1: "If Founds any face match" */}
              {bestMatch ? (
                <div className="bg-emerald-500/5 dark:bg-emerald-950/20 rounded-xl p-4 border-2 border-emerald-500 space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-wider">
                      Branch: If Founds any face match
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {(bestMatch.similarity * 100).toFixed(1)}% Match
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Registered Face Photo of Matched Employee */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-emerald-500 shrink-0 flex items-center justify-center relative shadow-md">
                      {bestMatch.profile.photo_url ? (
                        <img
                          src={bestMatch.profile.photo_url}
                          alt={bestMatch.profile.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-emerald-600 text-white text-[7px] font-mono text-center font-bold">
                        MATCHED
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {bestMatch.profile.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        {bestMatch.profile.job_post}
                      </div>
                      <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono">
                        {bestMatch.profile.contact}
                      </div>
                    </div>
                  </div>

                  {/* Flowchart Step Box: Mark face detected employe's attendance for current date & time */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500/30 text-xs font-mono space-y-1">
                    <div className="text-slate-500 text-[11px]">Marking for Current Date &amp; Time:</div>
                    <div className="text-slate-900 dark:text-white font-bold flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{formattedDate} • {formattedTime}</span>
                    </div>
                  </div>

                  {/* Flowchart Step: Push to database OR Already Marked Guardrail */}
                  {existingTodayRecord ? (
                    <div className="bg-amber-500/10 dark:bg-amber-950/20 rounded-xl p-3.5 border border-amber-500/40 text-left font-mono space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>ATTENDANCE ALREADY RECORDED TODAY</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                        <strong className="text-slate-900 dark:text-white">{bestMatch.profile.name}</strong> has already marked attendance today at{' '}
                        <strong className="text-amber-700 dark:text-amber-400 font-mono">
                          {new Date(existingTodayRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </strong>
                        . The system enforces strictly 1 attendance check-in per calendar day.
                      </p>
                      <button
                        disabled
                        className="w-full py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-wider font-mono cursor-not-allowed border border-slate-300 dark:border-slate-700 flex items-center justify-center gap-2"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Daily Attendance Completed</span>
                      </button>
                      <div className="text-center pt-1">
                        <button
                          onClick={handleRetry}
                          className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                          Scan Next Employee &rarr;
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <button
                        onClick={() => triggerMarkAttendance(bestMatch.profile, bestMatch.similarity)}
                        disabled={isSubmitting}
                        className="w-full py-3.5 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
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
                              {countdown !== null && countdown > 0
                                ? `Push to Database (${countdown}s Auto-lock)`
                                : 'Push to Database'}
                            </span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-1">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={autoMarkEnabled}
                            onChange={(e) => setAutoMarkEnabled(e.target.checked)}
                            className="rounded text-emerald-500 focus:ring-0"
                          />
                          <span>Auto-push on face lock (1.5s)</span>
                        </label>
                        <button
                          onClick={handleRetry}
                          className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                        >
                          Scan Different Person
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : currentFrame?.detected ? (
                /* Branch 2: Else -> Retry (Stranger / Unrecognized Face) */
                <div className="bg-rose-500/10 rounded-xl p-4 border-2 border-rose-500/40 text-center font-mono text-xs space-y-3.5">
                  <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                    <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse text-rose-500" />
                    <span>&lt; Face detected: Else (Unrecognized Face) &gt;</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    This face does NOT match any registered employee in the system (Threshold: 89.0% &ndash; 100.0%).
                    Following flowchart branch: <strong className="text-rose-600 dark:text-rose-400 font-mono">Else &rarr; Retry</strong>.
                  </p>
                  {candidateScore !== null && (
                    <div className="inline-block px-3 py-1 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono text-[11px] font-semibold">
                      Candidate similarity: {(candidateScore * 100).toFixed(1)}% &bull; Required: 89.0% &ndash; 100.0%
                    </div>
                  )}

                  {/* Flowchart Box: [ Retry ] */}
                  <div className="pt-1">
                    <button
                      onClick={handleRetry}
                      className="w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Retry (Re-initialize Face Detection)</span>
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1.5">
                      Loops back to Initialize Face Detection function
                    </p>
                  </div>
                </div>
              ) : (
                /* State: Waiting for Subject in Viewfinder */
                <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800/80 text-center font-mono text-xs text-slate-500 space-y-2">
                  <ScanFace className="w-8 h-8 text-cyan-500/60 mx-auto animate-pulse" />
                  <div className="font-semibold text-slate-700 dark:text-slate-300">
                    Initialize Face Detection function Active
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Align your face in the camera oval. When a face match is found, attendance will be marked for current date &amp; time and pushed to database.
                  </p>
                </div>
              )}

              {/* Guardrail Checklist */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-[11px] font-mono">
                <div
                  className={`flex items-center gap-1.5 ${
                    currentFrame?.faceCount === 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentFrame?.faceCount === 1 ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                  <span>Single Person</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    currentFrame?.liveness.isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentFrame?.liveness.isLive ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                  <span>Liveness Check</span>
                </div>

                <div
                  className={`flex items-center gap-1.5 ${
                    currentFrame?.quality.isOptimal ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentFrame?.quality.isOptimal ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-slate-400 dark:bg-slate-600'
                    }`}
                  />
                  <span>Light &amp; Sharp</span>
                </div>
              </div>
            </div>

            {/* Flowchart Architecture Specs Card */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 text-xs font-mono space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2">
                  <Play className="w-3.5 h-3.5 text-emerald-500 fill-current" />
                  <span>Algorithm Execution Pathway</span>
                </div>
                <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-bold">100% Client WASM</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                1. <strong>Initialize Face Detection function:</strong> MediaPipe WASM detects 478 face landmarks.<br />
                2. <strong>&lt; Face detected &gt;:</strong> Compares with registered employees.<br />
                3. <strong>Else &rarr; [Retry]:</strong> Unknown faces are blocked and routed to Retry.<br />
                4. <strong>If Founds any face match:</strong> Identifies employee, marks attendance for current date &amp; time, and pushes to database.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
