"use client";

import React from "react";

interface VSSHeaderProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  running: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const VSSHeader: React.FC<VSSHeaderProps> = ({
  isFullscreen,
  onToggleFullscreen,
  running,
  onStart,
  onStop,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 flex-shrink-0">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
           VSS Test
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 leading-relaxed">
          Two quick intervals. Pick which one had the pattern.
          <span className="hidden sm:inline"> Minimal controls. </span>
          Keyboard: <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Space</kbd> start,
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">1/2</kbd> answer,
          <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">Esc</kbd> stop.
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onToggleFullscreen}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
        {!running ? (
          <button
            onClick={onStart}
            className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
          >
            Start
          </button>
        ) : (
          <button
            onClick={onStop}
            className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 transition-colors"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
};



