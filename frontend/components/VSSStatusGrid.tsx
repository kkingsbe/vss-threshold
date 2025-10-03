"use client";

import React from "react";

interface VSSStatusGridProps {
  trialNum: number;
  correct: number;
  incorrect: number;
  reversalsCount: number;
  estThreshold: number | null;
}

export const VSSStatusGrid: React.FC<VSSStatusGridProps> = ({ trialNum, correct, incorrect, reversalsCount, estThreshold }) => {
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
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Threshold (est.)</div>
          <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{estThreshold ? `${estThreshold.toFixed(1)}%` : "—"}</div>
        </div>
      </div>
    </div>
  );
};



