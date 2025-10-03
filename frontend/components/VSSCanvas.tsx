"use client";

import React from "react";

interface VSSCanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  awaitingResponse: boolean;
  running: boolean;
  currentInterval: 1 | 2 | null;
}

export const VSSCanvas: React.FC<VSSCanvasProps> = ({ canvasRef, awaitingResponse, running }) => {
  return (
    <div className="relative flex-1 min-h-0 sm:min-h-[300px] md:min-h-[400px] lg:min-h-0 max-h-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-gray-500 dark:bg-gray-700">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Removed interval badges to eliminate visual differences between intervals */}

      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs sm:text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700 z-10">
        <span className="font-medium">
          {awaitingResponse ? "Respond: 1 or 2" : running ? "Presenting…" : "Idle"}
        </span>
      </div>
    </div>
  );
};



