"use client";

import React, { useRef } from "react";
import { useVSSExperiment } from "../hooks/useVSSExperiment";
import { useFullscreen } from "../hooks/useFullscreen";
import { VSSHeader } from "./VSSHeader";
import { VSSResponsePrompt } from "./VSSResponsePrompt";
import { VSSCompletionModal } from "./VSSCompletionModal";
import { VSSInstructionsModal } from "./VSSInstructionsModal";
import { VSSCanvas } from "./VSSCanvas";
import { VSSStatusGrid } from "./VSSStatusGrid";
import { VSSTips } from "./VSSTips";

export const VSSDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    running,
    trialNum,
    awaitingResponse,
    currentInterval,
    stats,
    reversals,
    estThreshold,
    rmsContrast,
    showResponsePrompt,
    showCompletionModal,
    showInstructionsModal,
    stopReason,
    sessionQCs,
    start,
    startExperiment,
    stop,
    handleResponse,
    setShowCompletionModal,
  } = useVSSExperiment(canvasRef);

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  return (
    <div ref={containerRef} className="min-h-screen min-h-[100svh] h-[100dvh] w-full flex flex-col p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
      <VSSHeader
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        running={running}
        onStart={() => void start()}
        onStop={stop}
      />

      <div className="relative flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-4 min-h-0">
        <VSSInstructionsModal
          visible={showInstructionsModal}
          onStart={() => void startExperiment()}
        />

        <VSSCompletionModal
          visible={showCompletionModal}
          stopReason={stopReason}
          estThreshold={estThreshold}
          rmsContrast={rmsContrast}
          reversalsCount={reversals.length}
          trialNum={trialNum}
          correctCount={stats.correct}
          sessionQCs={sessionQCs}
          onClose={() => setShowCompletionModal(false)}
          onRestart={() => { setShowCompletionModal(false); void start(); }}
        />

        <VSSResponsePrompt visible={showResponsePrompt} onPick={(c) => void handleResponse(c)} />

        <div className="flex-1 flex flex-col min-h-0">
          <VSSCanvas
            canvasRef={canvasRef}
            awaitingResponse={awaitingResponse}
            running={running}
            currentInterval={currentInterval}
          />
        </div>

        <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-80 flex-shrink-0">
          <VSSStatusGrid
            trialNum={trialNum}
            correct={stats.correct}
            incorrect={stats.incorrect}
            reversalsCount={reversals.length}
            estThreshold={estThreshold}
            rmsContrast={rmsContrast}
          />
          <VSSTips />
        </div>
      </div>
    </div>
  );
};



