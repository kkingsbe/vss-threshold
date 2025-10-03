"use client";

import React from "react";

interface VSSInstructionsModalProps {
  visible: boolean;
  onStart: () => void;
}

export const VSSInstructionsModal: React.FC<VSSInstructionsModalProps> = ({
  visible,
  onStart,
}) => {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 flex items-start justify-center bg-gray-900/95 backdrop-blur-sm z-50">
      <div className="mt-10 sm:mt-16 text-center">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-lg mx-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Instructions</h2>
          
          <div className="text-left space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              In this experiment, you will see <strong>two intervals</strong> separated by a brief blank screen.
            </p>
            
            <p>
              <strong>One interval will contain a flickering noise pattern</strong> (like TV static), 
              and the other will be blank.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Your Task:</p>
              <p className="text-blue-800 dark:text-blue-200">
                After both intervals are shown, select which interval (1 or 2) contained the noise pattern.
              </p>
            </div>
            
            <div className="space-y-2 text-sm">
              <p><strong>Controls:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Press <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">1</kbd> to choose interval 1</li>
                <li>Press <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">2</kbd> to choose interval 2</li>
                <li>Press <kbd className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 font-mono text-xs">Esc</kbd> to stop early</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              The noise will become harder to see as you answer correctly. Try your best, but it&apos;s okay to guess if you&apos;re unsure.
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={onStart}
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Start Experiment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

