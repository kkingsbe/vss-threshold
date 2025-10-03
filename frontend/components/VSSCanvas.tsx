"use client";

import React from "react";

interface VSSCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  awaitingResponse: boolean;
  running: boolean;
  currentInterval: 1 | 2 | null;
}

export const VSSCanvas: React.FC<VSSCanvasProps> = ({ canvasRef, awaitingResponse, running, currentInterval }) => {
  return (
    <div className="relative flex-1 min-h-0 sm:min-h-[300px] md:min-h-[400px] lg:min-h-0 max-h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {currentInterval && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div
            className={`${
              currentInterval === 1 ? 'bg-blue-600 ring-blue-300/50' : 'bg-orange-600 ring-orange-300/50'
            } text-white w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center shadow-2xl ring-4`}
          >
            <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-none">{currentInterval}</span>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs sm:text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700 z-10">
        <span className="font-medium">
          {awaitingResponse ? "Respond: 1 or 2" : running ? "Presenting…" : "Idle"}
        </span>
      </div>
    </div>
  );
};



