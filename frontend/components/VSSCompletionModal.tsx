"use client";

import React from "react";
import type { StopReason } from "../hooks/useVSSExperiment";

interface VSSCompletionModalProps {
  visible: boolean;
  stopReason: StopReason;
  estThreshold: number | null;
  reversalsCount: number;
  trialNum: number;
  correctCount: number;
  onClose: () => void;
  onRestart: () => void;
}

export const VSSCompletionModal: React.FC<VSSCompletionModalProps> = ({
  visible,
  stopReason,
  estThreshold,
  reversalsCount,
  trialNum,
  correctCount,
  onClose,
  onRestart,
}) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex items-start justify-center bg-gray-900/95 backdrop-blur-sm z-40">
      <div className="mt-10 sm:mt-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-lg mx-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session Complete</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {stopReason === 'trials' && 'Stopped after reaching the maximum number of trials.'}
            {stopReason === 'reversals' && 'Stopped after reaching the maximum number of reversals.'}
            {stopReason === 'converged' && 'Stopped because the staircase converged.'}
          </p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Estimated Threshold</div>
              <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">{estThreshold ? `${estThreshold.toFixed(1)}%` : '—'}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reversals</div>
              <div className="text-xl font-semibold">{reversalsCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Trials</div>
              <div className="text-xl font-semibold">{trialNum}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Correct</div>
              <div className="text-xl font-semibold text-green-600 dark:text-green-400">{correctCount}</div>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Close
            </button>
            <button
              onClick={onRestart}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Restart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};



