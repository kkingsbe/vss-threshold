"use client";

import React from "react";

export const VSSTips: React.FC = () => {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-3 flex-1 overflow-y-auto">
      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 flex items-center gap-1.5">
          <span className="text-sm">💡</span>
          <span className="text-sm sm:text-base">Quick Tips & Safety</span>
        </div>
        <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">•</span>
            <span>Dim room. Avoid Night Shift/True Tone if possible. If you feel unwell, press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Esc</kbd>.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">•</span>
            <span>The demo uses fixed parameters (15 Hz, small dot size). Only the stimulus contrast adapts automatically.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0">•</span>
            <span>Threshold here is a rough estimate from reversal means. A research version would use Bayesian adaptive staircases and calibrated display contrast.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};



