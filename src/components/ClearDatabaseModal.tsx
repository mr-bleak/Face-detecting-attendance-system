'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { clearAllDatabaseData } from '@/app/actions';
import { playWarningTone } from '@/lib/audio';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataCleared: () => void;
}

export const ClearDatabaseModal: React.FC<ClearDatabaseModalProps> = ({
  isOpen,
  onClose,
  onDataCleared,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await clearAllDatabaseData();
      if (res.success) {
        playWarningTone();
        onDataCleared();
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to clear database records.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network exception while clearing data.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4 mx-auto sm:mx-0">
          <Trash2 className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono mb-2">
          Delete All Database Data?
        </h3>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4 font-sans">
          This action will permanently wipe <strong className="text-rose-600 dark:text-rose-400">all registered personnel profiles</strong>, encrypted 128-d face embeddings, and all attendance audit logs from both Supabase and local cache.
        </p>

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-mono mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Confirmation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-rose-600/25 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Wiping Data...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Delete All Data</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
