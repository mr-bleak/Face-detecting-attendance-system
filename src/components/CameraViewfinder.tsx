'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, SwitchCamera, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { processVideoFrame } from '@/lib/faceEngine';
import { BiometricFrameResult } from '@/lib/types';
import { playLockBeep } from '@/lib/audio';

interface CameraViewfinderProps {
  onFrameResult: (result: BiometricFrameResult, videoEl: HTMLVideoElement) => void;
  overlayTitle?: string;
  isScanning?: boolean;
  throttleMs?: number; // Tuned for smooth mobile edge inference (130-160ms)
  className?: string;
  aspectRatioClass?: string;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onFrameResult,
  overlayTitle = 'Omnnixx 128D AI Vision',
  isScanning = true,
  throttleMs = 140,
  className,
  aspectRatioClass,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [streamActive, setStreamActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(30);
  const [currentResult, setCurrentResult] = useState<BiometricFrameResult | null>(null);

  const requestRef = useRef<number | null>(null);
  const lastProcessedTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const hasLockedBeepedRef = useRef<boolean>(false);
  // Smooth interpolated bounding box for silky 60 FPS mobile rendering
  const lerpBoxRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // Initialize camera stream
  const startCamera = useCallback(async () => {
    setPermissionError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: { ideal: facingMode },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr: any) {
          if (playErr.name !== 'AbortError') {
            console.warn('[Camera] play() warning:', playErr);
          }
        }
        setStreamActive(true);
      }
    } catch (err: any) {
      console.error('[Camera] getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('CAMERA_PERMISSION_DENIED: Please allow camera access in your browser or Android settings.');
      } else {
        setPermissionError(`Camera initialization failed: ${err.message || 'Device error'}`);
      }
      setStreamActive(false);
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [startCamera]);

  // Main Detection Loop (Hardware-accelerated with throttle)
  useEffect(() => {
    let active = true;

    const renderLoop = async () => {
      if (!active) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && streamActive && video.readyState >= 2) {
        const now = performance.now();

        // FPS Calculation
        frameCountRef.current++;
        if (now - lastFpsTimeRef.current >= 1000) {
          setFps(frameCountRef.current);
          frameCountRef.current = 0;
          lastFpsTimeRef.current = now;
        }

        // Check throttle interval (150-200ms) for WASM inference to prevent battery drain
        if (isScanning && now - lastProcessedTimeRef.current >= throttleMs) {
          lastProcessedTimeRef.current = now;
          const result = await processVideoFrame(video, now);
          setCurrentResult(result);
          onFrameResult(result, video);

          if (result.detected && result.quality.isOptimal && !hasLockedBeepedRef.current) {
            playLockBeep();
            hasLockedBeepedRef.current = true;
          } else if (!result.detected) {
            hasLockedBeepedRef.current = false;
          }
        }

        // Draw HUD overlay onto hardware Canvas
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw alignment oval guide
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radiusX = canvas.width * 0.28;
          const radiusY = canvas.height * 0.38;

          ctx.save();
          ctx.beginPath();
          ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
          ctx.strokeStyle = currentResult?.detected ? 'rgba(52, 211, 153, 0.4)' : 'rgba(56, 189, 248, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 6]);
          ctx.stroke();
          ctx.restore();

          // Smoothly interpolate bounding box towards target for buttery 60 FPS mobile tracking
          if (currentResult?.detected && currentResult.box) {
            const target = currentResult.box;
            if (!lerpBoxRef.current) {
              lerpBoxRef.current = { ...target };
            } else {
              // Exponential smoothing factor (0.35 gives fluid gliding without trailing lag)
              lerpBoxRef.current.x += (target.x - lerpBoxRef.current.x) * 0.35;
              lerpBoxRef.current.y += (target.y - lerpBoxRef.current.y) * 0.35;
              lerpBoxRef.current.width += (target.width - lerpBoxRef.current.width) * 0.35;
              lerpBoxRef.current.height += (target.height - lerpBoxRef.current.height) * 0.35;
            }

            const b = lerpBoxRef.current;
            const bx = b.x * canvas.width;
            const by = b.y * canvas.height;
            const bw = b.width * canvas.width;
            const bh = b.height * canvas.height;

            const isOptimal = currentResult.quality.isOptimal;
            const isMultiple = currentResult.faceCount > 1;

            const strokeColor = isMultiple ? '#ef4444' : isOptimal ? '#10b981' : '#f59e0b';

            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 10;

            // Reticle corner brackets
            const cornerSize = Math.min(bw, bh) * 0.22;
            // Top-Left
            ctx.beginPath();
            ctx.moveTo(bx, by + cornerSize);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + cornerSize, by);
            ctx.stroke();

            // Top-Right
            ctx.beginPath();
            ctx.moveTo(bx + bw - cornerSize, by);
            ctx.lineTo(bx + bw, by);
            ctx.lineTo(bx + bw, by + cornerSize);
            ctx.stroke();

            // Bottom-Left
            ctx.beginPath();
            ctx.moveTo(bx, by + bh - cornerSize);
            ctx.lineTo(bx, by + bh);
            ctx.lineTo(bx + cornerSize, by + bh);
            ctx.stroke();

            // Bottom-Right
            ctx.beginPath();
            ctx.moveTo(bx + bw - cornerSize, by + bh);
            ctx.lineTo(bx + bw, by + bh);
            ctx.lineTo(bx + bw, by + bh - cornerSize);
            ctx.stroke();

            // Smooth scan radar sweep
            const scanY = by + (Math.sin(now / 220) * 0.5 + 0.5) * bh;
            ctx.beginPath();
            ctx.moveTo(bx, scanY);
            ctx.lineTo(bx + bw, scanY);
            ctx.strokeStyle = isOptimal ? 'rgba(16, 185, 129, 0.75)' : 'rgba(56, 189, 248, 0.75)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Draw primary facial landmarks (eyes, nose, mouth points)
            if (currentResult.landmarks) {
              ctx.fillStyle = isOptimal ? 'rgba(52, 211, 153, 0.85)' : 'rgba(56, 189, 248, 0.85)';
              const keyIndices = [33, 133, 362, 263, 1, 61, 291, 152, 10];
              for (const idx of keyIndices) {
                const pt = currentResult.landmarks[idx];
                if (pt) {
                  ctx.beginPath();
                  ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 2.5, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
            }

            ctx.restore();
          } else {
            lerpBoxRef.current = null;
          }
        }
      }

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);

    return () => {
      active = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [streamActive, isScanning, throttleMs, onFrameResult]);

  // Flip camera (front/rear for mobile devices)
  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl dark:shadow-2xl transition-colors ${
        className || 'max-w-lg mx-auto'
      }`}
    >
      {/* Top HUD Status Header */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-cyan-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{overlayTitle}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
            {fps} FPS
          </div>
          <button
            onClick={toggleCamera}
            className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-lg bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-slate-700 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Switch Camera (Front/Rear)"
          >
            <SwitchCamera className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-semibold hidden xs:inline sm:inline">
              {facingMode === 'user' ? 'Front' : 'Back'}
            </span>
          </button>
        </div>
      </div>

      {/* Video & Canvas Elements */}
      <div
        className={`relative w-full ${
          aspectRatioClass || 'aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] xl:aspect-[16/10]'
        } max-h-[42vh] sm:max-h-[52vh] lg:max-h-[62vh] bg-slate-950 flex items-center justify-center overflow-hidden`}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${
            facingMode === 'user' ? '-scale-x-100' : ''
          }`}
        />

        {/* Permission Denied UI */}
        {permissionError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 text-center z-30">
            <ShieldAlert className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
            <h3 className="text-base font-bold text-white mb-1">Camera Permission Required</h3>
            <p className="text-xs text-slate-400 max-w-xs mb-4">{permissionError}</p>
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Permission</span>
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Feedback Banner */}
      <div className="p-3 bg-white dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs font-mono transition-colors">
        {currentResult?.quality.issues.includes('MULTIPLE_FACES_DETECTED') ? (
          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Multiple faces detected! Only 1 person allowed.</span>
          </div>
        ) : currentResult?.quality.issues.includes('LOW_LIGHT_DETECTED') ? (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Low light environment detected. Move to brighter lighting.</span>
          </div>
        ) : currentResult?.detected ? (
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-bold">Target Locked • {currentResult.liveness.reason}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
            <Camera className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400 animate-pulse" />
            <span>Align your face within the targeting oval</span>
          </div>
        )}

        {/* Liveness badge */}
        {currentResult?.detected && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
            <Sparkles className="w-3 h-3" />
            <span>Liveness: {Math.round(currentResult.liveness.score * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};
