"use client";

import React from "react";

interface VSSResponsePromptProps {
  visible: boolean;
  onPick: (choice: 1 | 2) => void;
}

export const VSSResponsePrompt: React.FC<VSSResponsePromptProps> = ({ visible, onPick }) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex items-start justify-center bg-gray-900/95 backdrop-blur-sm z-30">
      <div className="mt-8 sm:mt-12 lg:mt-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md mx-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Select which interval contained the pattern:
          </h2>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => onPick(1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              1 - First Interval
            </button>
            <button
              onClick={() => onPick(2)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              2 - Second Interval
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Or press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">1</kbd> or <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">2</kbd> on your keyboard
          </p>
        </div>
      </div>
    </div>
  );
};



