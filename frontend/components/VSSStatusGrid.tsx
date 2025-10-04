"use client";

import React from "react";
import type { ThresholdResult } from "../hooks/useVSSExperiment";

interface VSSStatusGridProps {
  trialNum: number;
  correct: number;
  incorrect: number;
  reversalsCount: number;
  estThreshold: number | null;
  rmsContrast: ThresholdResult | null;
}

export const VSSStatusGrid: React.FC<VSSStatusGridProps> = ({ trialNum, correct, incorrect, reversalsCount, estThreshold, rmsContrast }) => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-2 sm:p-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3">
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Trials</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{trialNum}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Correct</div>
          <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">{correct}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Incorrect</div>
          <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">{incorrect}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Reversals</div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">{reversalsCount}</div>
        </div>
        <div className="text-center col-span-2 sm:col-span-3 lg:col-span-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 tracking-wide font-medium">Threshold at 15 Hz dynamic noise, 2IFC</div>
          <div className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">
            {rmsContrast ? `${rmsContrast.rmsPercent.toFixed(2)}% RMS (legacy ${rmsContrast.percentRange.toFixed(2)}% of range)` : "—"}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Lower = better</div>
        </div>
      </div>
    </div>
  );
};



