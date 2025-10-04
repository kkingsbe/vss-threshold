"use client";

import React from "react";
import type { StopReason, ThresholdResult, QC } from "../hooks/useVSSExperiment";

interface VSSCompletionModalProps {
  visible: boolean;
  stopReason: StopReason;
  estThreshold: number | null;
  rmsContrast: ThresholdResult | null;
  reversalsCount: number;
  trialNum: number;
  correctCount: number;
  sessionQCs: QC[];
  onClose: () => void;
  onRestart: () => void;
}

export const VSSCompletionModal: React.FC<VSSCompletionModalProps> = ({
  visible,
  stopReason,
  estThreshold,
  rmsContrast,
  reversalsCount,
  trialNum,
  correctCount,
  sessionQCs,
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
            <div className="col-span-2">
              <div className="text-xs tracking-wide text-gray-500 dark:text-gray-400">Threshold at 15 Hz dynamic noise, 2IFC</div>
              <div className="text-xl font-semibold text-blue-600 dark:text-blue-400 mt-1">
                {rmsContrast ? `${rmsContrast.rmsPercent.toFixed(2)}% RMS (legacy ${rmsContrast.percentRange.toFixed(2)}% of range)` : '—'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lower = better</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reversals</div>
              <div className="text-xl font-semibold">{reversalsCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Trials</div>
              <div className="text-xl font-semibold">{trialNum}</div>
            </div>
            <div className="col-span-2">
              <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Correct</div>
              <div className="text-xl font-semibold text-green-600 dark:text-green-400">{correctCount}</div>
            </div>
          </div>
          
          {/* QC Metrics */}
          {sessionQCs.length > 0 && (
            <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
              <details className="text-left">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Quality Control Metrics ({sessionQCs.length} trials)
                </summary>
                <div className="mt-2 max-h-48 overflow-y-auto text-xs space-y-1">
                  <div className="grid grid-cols-6 gap-1 font-semibold text-gray-600 dark:text-gray-400 sticky top-0 bg-white dark:bg-gray-800 pb-1">
                    <div>Trial</div>
                    <div>Contrast</div>
                    <div>RefreshHz</div>
                    <div>IntendHz</div>
                    <div>EffectHz</div>
                    <div>Updates</div>
                  </div>
                  {sessionQCs.map((qc, idx) => {
                    const hzDiff = Math.abs(qc.effectiveHz - qc.intendedHz);
                    const isGood = hzDiff < 0.5; // within 0.5 Hz is good
                    return (
                      <div 
                        key={idx} 
                        className={`grid grid-cols-6 gap-1 ${isGood ? 'text-gray-700 dark:text-gray-300' : 'text-orange-600 dark:text-orange-400 font-semibold'}`}
                      >
                        <div>{qc.trialNum}</div>
                        <div>{qc.contrastPct.toFixed(1)}%</div>
                        <div>{qc.refreshHz.toFixed(0)}</div>
                        <div>{qc.intendedHz.toFixed(0)}</div>
                        <div>{qc.effectiveHz.toFixed(1)}</div>
                        <div>{qc.updates}</div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          )}
          
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



