"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp, mulberry32, sleep, stddev } from "../lib/utils";

export type StopReason = "trials" | "reversals" | "converged" | null;

export interface ExperimentStats {
  correct: number;
  incorrect: number;
}

export interface UseVSSExperimentResult {
  // state
  running: boolean;
  trialNum: number;
  awaitingResponse: boolean;
  currentInterval: 1 | 2 | null;
  stats: ExperimentStats;
  reversals: number[];
  estThreshold: number | null;
  showResponsePrompt: boolean;
  showCompletionModal: boolean;
  showInstructionsModal: boolean;
  stopReason: StopReason;
  // actions
  start: () => void;
  startExperiment: () => Promise<void>;
  stop: () => void;
  handleResponse: (choice: 1 | 2) => Promise<void>;
  setShowCompletionModal: (v: boolean) => void;
  setShowInstructionsModal: (v: boolean) => void;
}

export const useVSSExperiment = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): UseVSSExperimentResult => {
  // Fixed stimulus parameters for simplicity
  const FREQ_HZ = 15; // temporal update rate
  const BLOCK_PX = 2; // spatial scale (pixel block size)
  const INTERVAL_MS_RANGE: [number, number] = [400, 600]; // jittered interval duration
  const ISI_MS_RANGE: [number, number] = [250, 450]; // jittered ISI
  // Stop criteria
  const MAX_TRIALS = 80;
  const MAX_REVERSALS = 10;
  const CONVERGENCE_REVERSALS = 6;
  const CONVERGENCE_STDDEV = 2; // percent contrast
  
  // Helper for jittered timing
  const randMs = (lo: number, hi: number) => Math.floor(lo + Math.random() * (hi - lo));

  // 2AFC state
  const [running, setRunning] = useState(false);
  const [trialNum, setTrialNum] = useState(0);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [correctInterval, setCorrectInterval] = useState<1 | 2 | null>(null);
  const [stats, setStats] = useState<ExperimentStats>({ correct: 0, incorrect: 0 });

  // 2-down/1-up staircase params
  const [contrastPct, setContrastPct] = useState(20); // current level (%), 1..100
  const [stepPct, setStepPct] = useState(6); // adaptive step size (starts larger, shrinks after reversals)
  const [reversals, setReversals] = useState<number[]>([]);
  const lastDirRef = useRef<number | null>(null); // -1 down (harder), +1 up (easier)
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0); // for 2-down/1-up

  const [showResponsePrompt, setShowResponsePrompt] = useState(false);
  const [currentInterval, setCurrentInterval] = useState<1 | 2 | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [stopReason, setStopReason] = useState<StopReason>(null);

  const seedRef = useRef<number>(12345);
  // Reusable offscreen buffer for noise generation
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const offctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const imgRef = useRef<ImageData | null>(null);

  const drawBlank = useCallback(() => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.fillStyle = "rgb(127, 127, 127)"; // mid-gray to eliminate brightness cues
    ctx.fillRect(0, 0, cvs.width, cvs.height);
  }, [canvasRef]);

  const ensureOffscreen = useCallback((w: number, h: number) => {
    let cnv = offscreenRef.current;
    if (!cnv || cnv.width !== w || cnv.height !== h) {
      cnv = document.createElement("canvas");
      cnv.width = w; cnv.height = h;
      offscreenRef.current = cnv;
      offctxRef.current = cnv.getContext("2d");
      imgRef.current = null; // force reallocation of ImageData next draw
    }
    if (!offctxRef.current) {
      offctxRef.current = cnv.getContext("2d");
    }
    if (!imgRef.current || imgRef.current.width !== w || imgRef.current.height !== h) {
      imgRef.current = offctxRef.current!.createImageData(w, h);
    }
    return { off: cnv, octx: offctxRef.current!, img: imgRef.current! };
  }, []);

  const present2AFC = useCallback(async () => {
    const cvs = canvasRef.current; if (!cvs) return 1 as 1 | 2;
    const ctx = cvs.getContext("2d", { alpha: false });
    if (!ctx) return 1 as 1 | 2;
    const width = cvs.width, height = cvs.height;

    // Unified fixation marker (same color for both intervals)
    const drawVisualFrame = () => {
      ctx.fillStyle = "rgb(127, 127, 127)"; // mid-gray background
      ctx.fillRect(0, 0, width, height);
    };

    const drawFixationDot = () => {
      const dotRadius = Math.max(4, Math.min(8, width * 0.008));
      ctx.beginPath(); ctx.arc(width / 2, height / 2, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#333"; // neutral dark fixation point (same for both intervals)
      ctx.fill();
    };

    const maskFlash = async () => {
      // Simple mid-gray blank to avoid afterimages while still providing temporal separation
      drawBlank();
      await sleep(300);
    };

    const drawIntervalNoise = async (seedBase: number, cPct: number, intervalMs: number) => {
      const targetHz = clamp(FREQ_HZ, 1, 60);
      const framePeriod = 1000 / targetHz;
      const inset = 0;
      const bs = Math.max(1, Math.floor(BLOCK_PX));
      const w = Math.max(1, Math.floor((width - 2 * inset) / bs));
      const h = Math.max(1, Math.floor((height - 2 * inset) / bs));

      const drawNoiseFrame = (frameIndex: number) => {
        drawVisualFrame();
        const { off, octx, img } = ensureOffscreen(w, h);
        const rng = mulberry32((seedBase + frameIndex * 29) >>> 0);
        const c = clamp(cPct / 100, 0, 1);
        // Zero-mean noise around mid-gray (127.5) to keep constant mean luminance
        const amp = c * 127.5;
        for (let p = 0; p < img.data.length; p += 4) {
          const u = (rng() - 0.5) * 2; // uniform [-1, 1]
          const px = clamp(127.5 + u * amp, 0, 255);
          img.data[p] = px; img.data[p + 1] = px; img.data[p + 2] = px; img.data[p + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, w, h, inset, inset, width - 2 * inset, height - 2 * inset);
        // Draw fixation dot AFTER noise so it's always visible
        drawFixationDot();
      };

      // Draw first noise frame immediately at interval onset
      let i = 0;
      let last = performance.now();
      let elapsed = 0, acc = 0;
      drawNoiseFrame(i++);

      // Continue updating at target frame rate
      await new Promise<void>((resolve) => {
        const step = (t: number) => {
          const dt = t - last; last = t; elapsed += dt; acc += dt;
          if (acc >= framePeriod) {
            acc -= framePeriod;
            drawNoiseFrame(i++);
          }
          if (elapsed >= intervalMs) return resolve();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    const which: 1 | 2 = Math.random() < 0.5 ? 1 : 2;
    setCorrectInterval(which);

    // Jittered timings for each trial
    const intervalMs = randMs(...INTERVAL_MS_RANGE);
    const isiMs = randMs(...ISI_MS_RANGE);

    drawBlank(); await sleep(200);

    if (which === 1) {
      setCurrentInterval(1);
      await drawIntervalNoise(seedRef.current + 101, contrastPct, intervalMs);
    } else {
      setCurrentInterval(1);
      drawVisualFrame(); 
      drawFixationDot();
      await sleep(intervalMs);
      setCurrentInterval(null);
    }

    await maskFlash();
    await sleep(isiMs);

    if (which === 2) {
      setCurrentInterval(2);
      await drawIntervalNoise(seedRef.current + 303, contrastPct, intervalMs);
    } else {
      setCurrentInterval(2);
      drawVisualFrame();
      drawFixationDot();
      await sleep(intervalMs);
      setCurrentInterval(null);
    }

    drawBlank();
    setShowResponsePrompt(true);
    setAwaitingResponse(true);
    return which;
  }, [BLOCK_PX, FREQ_HZ, INTERVAL_MS_RANGE, ISI_MS_RANGE, canvasRef, ensureOffscreen, drawBlank, contrastPct, randMs]);

  const start = useCallback(() => {
    if (running) return;
    setShowInstructionsModal(true);
  }, [running]);

  const startExperiment = useCallback(async () => {
    setShowInstructionsModal(false);
    setRunning(true);
    setTrialNum(0);
    setStats({ correct: 0, incorrect: 0 });
    setReversals([]);
    setShowResponsePrompt(false);
    setCurrentInterval(null);
    setShowCompletionModal(false);
    setStopReason(null);
    setContrastPct(20);
    setStepPct(6); // reset adaptive step size to initial value
    lastDirRef.current = null;
    setConsecutiveCorrect(0); // reset for 2-down/1-up
    drawBlank();
    await present2AFC();
  }, [drawBlank, present2AFC]);

  const stop = useCallback(() => {
    setRunning(false);
    setAwaitingResponse(false);
    setShowResponsePrompt(false);
    setCurrentInterval(null);
    setShowInstructionsModal(false);
    drawBlank();
  }, [drawBlank]);

  const handleResponse = useCallback(async (choice: 1 | 2) => {
    if (!awaitingResponse) return;
    const correct = choice === correctInterval;
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), incorrect: s.incorrect + (correct ? 0 : 1) }));
    setTrialNum((n) => n + 1);

    setShowResponsePrompt(false);

    // 2-down/1-up staircase logic
    let dir: number | null = null;
    let newConsecutiveCorrect = consecutiveCorrect;
    
    if (correct) {
      newConsecutiveCorrect = consecutiveCorrect + 1;
      if (newConsecutiveCorrect >= 2) {
        // After 2 consecutive correct: make harder (decrease contrast)
        dir = -1;
        newConsecutiveCorrect = 0;
      }
    } else {
      // After 1 incorrect: make easier (increase contrast)
      dir = +1;
      newConsecutiveCorrect = 0;
    }

    setConsecutiveCorrect(newConsecutiveCorrect);

    // Only update contrast and check reversals if we're making a change
    let next = contrastPct;
    if (dir !== null) {
      if (lastDirRef.current !== null && lastDirRef.current !== dir) {
        // Record reversal and adaptively shrink step size
        setReversals((r) => {
          const nextR = [...r, contrastPct];
          // Shrink step size after accumulating reversals for finer threshold estimate
          if (nextR.length === 2) setStepPct(4);
          if (nextR.length === 4) setStepPct(2);
          return nextR;
        });
      }
      lastDirRef.current = dir;
      next = clamp(contrastPct + dir * stepPct, 1, 100);
      setContrastPct(next);
    }

    setAwaitingResponse(false);

    const shouldStopByTrials = (prevTrialNum => prevTrialNum + 1 >= MAX_TRIALS)(trialNum);
    const shouldStopByReversals = (prevReversals => prevReversals.length >= MAX_REVERSALS)(reversals);
    const recentReversals = reversals.slice(-CONVERGENCE_REVERSALS);
    const hasConverged = recentReversals.length >= CONVERGENCE_REVERSALS && stddev(recentReversals) <= CONVERGENCE_STDDEV;

    if (running && !(shouldStopByTrials || shouldStopByReversals || hasConverged)) {
      setTimeout(() => { present2AFC(); }, 400);
    } else {
      setRunning(false);
      setShowResponsePrompt(false);
      setCurrentInterval(null);
      drawBlank();
      const reason: StopReason = shouldStopByTrials ? 'trials' : (shouldStopByReversals ? 'reversals' : (hasConverged ? 'converged' : null));
      setStopReason(reason);
      setShowCompletionModal(true);
    }
  }, [awaitingResponse, correctInterval, contrastPct, consecutiveCorrect, drawBlank, present2AFC, reversals, running, trialNum, stepPct]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "1") { void handleResponse(1); }
      else if (e.key === "2") { void handleResponse(2); }
      else if (e.key === " ") { if (!running) start(); }
      else if (e.key === "Escape") { stop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleResponse, running, start, stop]);

  // Initial clear
  useEffect(() => { drawBlank(); }, [drawBlank]);

  const estThreshold = useMemo(() => {
    if (reversals.length < 4) return null;
    const use = reversals.slice(-6);
    const m = use.reduce((a, b) => a + b, 0) / use.length;
    return m;
  }, [reversals]);

  // Resize canvas to fit container and clear when size changes
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const resize = () => {
      const parent = cvs.parentElement; if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const targetW = Math.floor(rect.width);
      const targetH = Math.floor(rect.height);
      if (cvs.width !== targetW || cvs.height !== targetH) {
        cvs.width = targetW; cvs.height = targetH;
        drawBlank();
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (cvs.parentElement) ro.observe(cvs.parentElement);
    return () => ro.disconnect();
  }, [canvasRef, drawBlank]);

  return {
    running,
    trialNum,
    awaitingResponse,
    currentInterval,
    stats,
    reversals,
    estThreshold,
    showResponsePrompt,
    showCompletionModal,
    showInstructionsModal,
    stopReason,
    start,
    startExperiment,
    stop,
    handleResponse,
    setShowCompletionModal,
    setShowInstructionsModal,
  };
};


