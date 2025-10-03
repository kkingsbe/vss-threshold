"use client";
import React, { useEffect, useRef, useState, useMemo } from "react";

// VSS Threshold Demo — Simplified UI
// Single-file React component designed for the ChatGPT canvas.
// Focus: minimal controls, clear flow, keyboard-friendly.
// Method: 2-Interval Forced Choice (2AFC) with a simple 1-up/1-down staircase
// Disclaimer: Demonstration only. Not a medical tool. No calibrated luminance.

// --- Helpers ---
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const stddev = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / arr.length;
  return Math.sqrt(variance);
};
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function VSSDemo() {
  // Fixed stimulus parameters for simplicity
  const FREQ_HZ = 15;    // temporal update rate
  const BLOCK_PX = 2;    // spatial scale (pixel block size)
  const INTERVAL_MS = 500;
  const ISI_MS = 350;
  // Stop criteria
  const MAX_TRIALS = 80;
  const MAX_REVERSALS = 10;
  const CONVERGENCE_REVERSALS = 6;
  const CONVERGENCE_STDDEV = 2; // percent contrast

  // 2AFC state
  const [running, setRunning] = useState(false);
  const [trialNum, setTrialNum] = useState(0);
  const [awaitingResponse, setAwaitingResponse] = useState(false);
  const [correctInterval, setCorrectInterval] = useState(null); // 1 | 2
  const [feedback, setFeedback] = useState(null); // "correct" | "incorrect" | null
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  // Simple staircase params (hidden from UI for minimalism)
  const [contrastPct, setContrastPct] = useState(20); // current level (%), 1..100
  const STEP_PCT = 5;                                 // fixed step size
  const [reversals, setReversals] = useState([]);
  const lastDirRef = useRef(null); // -1 down (harder), +1 up (easier)

  const [fullScreen, setFullScreen] = useState(false);
  const [showResponsePrompt, setShowResponsePrompt] = useState(false);
  const [currentInterval, setCurrentInterval] = useState(null); // 1 | 2 | null
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [stopReason, setStopReason] = useState(null); // 'trials' | 'reversals' | 'converged' | null

  const canvasRef = useRef(null);
  const seedRef = useRef(12345);
  // Reusable offscreen buffer for noise generation
  const offscreenRef = useRef(null);
  const offctxRef = useRef(null);
  const imgRef = useRef(null);

  // Resize canvas to fit container, reserve small header space
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const resize = () => {
      const rect = cvs.parentElement.getBoundingClientRect();
      const targetW = Math.floor(rect.width);
      const targetH = Math.floor(rect.height);
      if (cvs.width !== targetW || cvs.height !== targetH) {
        cvs.width = targetW;
        cvs.height = targetH;
        // Clear to white on resize
        const ctx = cvs.getContext("2d", { alpha: false });
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, targetW, targetH);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cvs.parentElement);
    return () => ro.disconnect();
  }, []);

  // Draw helpers
  const drawBlank = () => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d", { alpha: false });
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, cvs.width, cvs.height);
  };

  const ensureOffscreen = (w, h) => {
    let cnv = offscreenRef.current;
    if (!cnv || cnv.width !== w || cnv.height !== h) {
      cnv = document.createElement("canvas");
      cnv.width = w; cnv.height = h;
      offscreenRef.current = cnv;
      offctxRef.current = cnv.getContext("2d");
      imgRef.current = null; // force reallocation of ImageData next draw
    }
    if (!imgRef.current || imgRef.current.width !== w || imgRef.current.height !== h) {
      imgRef.current = offctxRef.current.createImageData(w, h);
    }
    return { off: cnv, octx: offctxRef.current, img: imgRef.current };
  };

  const drawNoiseFrame = (seed, cPct) => {
    const cvs = canvasRef.current; if (!cvs) return;
    const ctx = cvs.getContext("2d", { alpha: false });
    const { width, height } = cvs;
    const bs = Math.max(1, Math.floor(BLOCK_PX));
    const w = Math.max(1, Math.floor(width / bs));
    const h = Math.max(1, Math.floor(height / bs));
    const { off, octx, img } = ensureOffscreen(w, h);
    const rng = mulberry32(seed);
    const c = clamp(cPct / 100, 0, 1);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = rng();
      const px = 255 * ((1 - c) + c * n);
      img.data[i] = px; img.data[i + 1] = px; img.data[i + 2] = px; img.data[i + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, w, h, 0, 0, width, height);
  };

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Present two intervals, one with noise at current staircase contrast
  const present2AFC = async () => {
    const cvs = canvasRef.current; if (!cvs) return 1;
    const ctx = cvs.getContext("2d", { alpha: false });
    const width = cvs.width, height = cvs.height;

    const drawVisualFrame = (color) => {
      // Draw visual frame without text - text handled by HTML overlays
      ctx.fillStyle = "white"; ctx.fillRect(0, 0, width, height);
      // Scale banner height with canvas size for better proportions
      const bannerHeight = Math.max(40, Math.min(60, height * 0.12));
      ctx.fillStyle = color; ctx.fillRect(0, 0, width, bannerHeight);
      // Fixation dot - scale with canvas size but maintain proportions
      const dotRadius = Math.max(4, Math.min(8, width * 0.008));
      ctx.beginPath(); ctx.arc(width/2, height/2, dotRadius, 0, Math.PI*2);
      ctx.fillStyle = color; ctx.fill();
      // Border - scale thickness with canvas size
      const borderWidth = Math.max(6, Math.min(12, width * 0.012));
      ctx.lineWidth = borderWidth; ctx.strokeStyle = color; ctx.strokeRect(borderWidth/2, borderWidth/2, width-borderWidth, height-borderWidth);
    };

    const maskFlash = async () => {
      // Distinct separator: mid-grey flash with neutral border and dim fixation
      ctx.fillStyle = "#d9d9d9"; ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 10; ctx.strokeStyle = "#a3a3a3"; ctx.strokeRect(5, 5, width-10, height-10);
      ctx.beginPath(); ctx.arc(width/2, height/2, 4, 0, Math.PI*2);
      ctx.fillStyle = "#666"; ctx.fill();
      await sleep(200);
      // quick full blank after flash
      drawBlank(); await sleep(100);
    };

    const drawIntervalNoise = async (seedBase, cPct, color) => {
      drawVisualFrame(color);
      const targetHz = clamp(FREQ_HZ, 1, 60);
      const framePeriod = 1000 / targetHz;
      const inset = 16; // keep border visible
      const bs = Math.max(1, Math.floor(BLOCK_PX));
      const w = Math.max(1, Math.floor((width - 2*inset) / bs));
      const h = Math.max(1, Math.floor((height - 2*inset) / bs));
      let last = performance.now();
      let elapsed = 0, acc = 0, i = 0;
      await new Promise((resolve) => {
        const step = (t) => {
          const dt = t - last; last = t; elapsed += dt; acc += dt;
          if (acc >= framePeriod) {
            acc -= framePeriod;
            drawVisualFrame(color);
            const { off, octx, img } = ensureOffscreen(w, h);
            const rng = mulberry32((seedBase + i * 29) >>> 0);
            const c = clamp(cPct / 100, 0, 1);
            for (let p = 0; p < img.data.length; p += 4) {
              const n = rng();
              const px = 255 * ((1 - c) + c * n);
              img.data[p] = px; img.data[p+1] = px; img.data[p+2] = px; img.data[p+3] = 255;
            }
            octx.putImageData(img, 0, 0);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(off, 0, 0, w, h, inset, inset, width-2*inset, height-2*inset);
            i++;
          }
          if (elapsed >= INTERVAL_MS) return resolve();
          requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    };

    // Decide which interval contains signal
    const which = Math.random() < 0.5 ? 1 : 2;
    setCorrectInterval(which);

    // Clear lead-in
    drawBlank(); await sleep(200);

    // Interval 1 (blue theme)
    if (which === 1) {
      setCurrentInterval(1);
      await drawIntervalNoise(seedRef.current + 101, contrastPct, "#2563eb");
    } else {
      // show placeholder interval with blank inside blue frame
      setCurrentInterval(1);
      drawVisualFrame("#2563eb"); await sleep(INTERVAL_MS);
      setCurrentInterval(null);
    }

    // Strong visual separator between intervals
    await maskFlash();
    // small ISI jitter to reduce anticipatory responses
    await sleep(Math.floor(Math.random() * 50));

    // Interval 2 (amber theme)
    if (which === 2) {
      setCurrentInterval(2);
      await drawIntervalNoise(seedRef.current + 303, contrastPct, "#d97706");
    } else {
      setCurrentInterval(2);
      drawVisualFrame("#d97706"); await sleep(INTERVAL_MS);
      setCurrentInterval(null);
    }

    // End with clean white screen (no text overlay needed - handled by HTML)
    drawBlank();

    setShowResponsePrompt(true);
    setAwaitingResponse(true);
    return which;
  };

  // Start/stop flow
  const start = async () => {
    if (running) return;
    // Reset
    setRunning(true);
    setTrialNum(0);
    setStats({ correct: 0, incorrect: 0 });
    setReversals([]);
    setFeedback(null);
    setContrastPct(20);
    lastDirRef.current = null;
    setShowCompletionModal(false);
    setStopReason(null);
    drawBlank();
    // Kick off first trial
    await present2AFC();
  };

  const stop = () => {
    setRunning(false);
    setAwaitingResponse(false);
    setShowResponsePrompt(false);
    setCurrentInterval(null);
    setFeedback(null);
    drawBlank();
  };

  // Handle response (buttons or keys 1/2)
  const handleResponse = async (choice) => {
    if (!awaitingResponse) return;
    const correct = choice === correctInterval;
    setFeedback(correct ? "correct" : "incorrect");
    setStats((s) => ({ correct: s.correct + (correct ? 1 : 0), incorrect: s.incorrect + (correct ? 0 : 1) }));
    setTrialNum((n) => n + 1);

    // Hide response prompt overlay
    setShowResponsePrompt(false);

    // Staircase update
    const dir = correct ? -1 : +1; // go harder on correct, easier on wrong
    if (lastDirRef.current !== null && lastDirRef.current !== dir) {
      setReversals((r) => [...r, contrastPct]);
    }
    lastDirRef.current = dir;
    const next = clamp(contrastPct + dir * STEP_PCT, 1, 100);
    setContrastPct(next);

    setAwaitingResponse(false);

    // Check stop criteria
    const shouldStopByTrials = (prevTrialNum => prevTrialNum + 1 >= MAX_TRIALS)(trialNum);
    const shouldStopByReversals = (prevReversals => prevReversals.length >= MAX_REVERSALS)(reversals);
    const recentReversals = reversals.slice(-CONVERGENCE_REVERSALS);
    const hasConverged = recentReversals.length >= CONVERGENCE_REVERSALS && stddev(recentReversals) <= CONVERGENCE_STDDEV;

    if (running && !(shouldStopByTrials || shouldStopByReversals || hasConverged)) {
      // brief pause then next trial
      setTimeout(() => { present2AFC(); }, 400);
    } else {
      // Auto-stop and keep the canvas clean
      setRunning(false);
      setShowResponsePrompt(false);
      setCurrentInterval(null);
      drawBlank();
      // record reason and show completion modal
      const reason = shouldStopByTrials ? 'trials' : (shouldStopByReversals ? 'reversals' : (hasConverged ? 'converged' : null));
      setStopReason(reason);
      setShowCompletionModal(true);
    }
  };

  // Keyboard shortcuts: 1 or 2 to answer; Space to start; Esc to stop.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "1") { handleResponse(1); }
      else if (e.key === "2") { handleResponse(2); }
      else if (e.key === " ") { if (!running) start(); }
      else if (e.key === "Escape") { stop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, awaitingResponse, correctInterval, contrastPct, currentInterval]);

  // Estimated threshold = mean of last few reversals
  const estThreshold = useMemo(() => {
    if (reversals.length < 4) return null;
    const use = reversals.slice(-6);
    const m = use.reduce((a, b) => a + b, 0) / use.length;
    return m;
  }, [reversals]);

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    const el = canvasRef.current?.parentElement;
    if (!document.fullscreenElement) {
      try { await el.requestFullscreen(); setFullScreen(true); } catch {}
    } else {
      try { await document.exitFullscreen(); setFullScreen(false); } catch {}
    }
  };

  // Initial clear
  useEffect(() => { drawBlank(); }, []);

  return (
      <div className="h-screen w-full flex flex-col p-2 sm:p-3 lg:p-4 gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100 leading-tight">
              Visual Snow Threshold — Demo
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
                onClick={toggleFullscreen}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            >
              {fullScreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
            {!running ? (
                <button
                    onClick={start}
                    className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-transparent bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
                >
                  Start
                </button>
            ) : (
                <button
                    onClick={stop}
                    className="px-3 py-1.5 sm:px-5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg shadow-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                >
                  Stop
                </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
      <div className="relative flex-1 flex flex-col lg:flex-row gap-2 sm:gap-3 lg:gap-4 min-h-0">
        {/* Completion Modal - positioned above everything */}
        {showCompletionModal && (
          <div className="absolute inset-0 flex items-start justify-center bg-gray-900/95 backdrop-blur-sm z-40">
            <div className="mt-10 sm:mt-16 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-lg mx-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session Complete</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {stopReason === 'trials' && 'Stopped after reaching the maximum number of trials.'}
                  {stopReason === 'reversals' && 'Stopped after reaching the maximum number of reversals.'}
                  {stopReason === 'converged' && 'Stopped because the staircase converged.'}
                </p>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Estimated Threshold</div>
                    <div className="text-xl font-semibold text-blue-600 dark:text-blue-400">{estThreshold ? `${estThreshold.toFixed(1)}%` : '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reversals</div>
                    <div className="text-xl font-semibold">{reversals.length}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Trials</div>
                    <div className="text-xl font-semibold">{trialNum}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Correct</div>
                    <div className="text-xl font-semibold text-green-600 dark:text-green-400">{stats.correct}</div>
                  </div>
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => { setShowCompletionModal(false); }}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { setShowCompletionModal(false); start(); }}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Restart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Response Prompt - positioned above everything */}
          {showResponsePrompt && (
              <div className="absolute inset-0 flex items-start justify-center bg-gray-900/95 backdrop-blur-sm z-30">
                <div className="mt-8 sm:mt-12 lg:mt-16 text-center">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 max-w-md mx-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      Select which interval contained the pattern:
                    </h2>
                    <div className="flex gap-4 justify-center">
                      <button
                          onClick={() => handleResponse(1)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        1 - First Interval
                      </button>
                      <button
                          onClick={() => handleResponse(2)}
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
          )}

        {/* Left Column: Canvas with centered interval number overlay */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Canvas Area - Takes most space */}
          <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] lg:min-h-0 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg bg-white dark:bg-gray-900">
            <canvas ref={canvasRef} className="w-full h-full block" />

            {/* Centered Interval Number Overlay */}
            {currentInterval && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                <div className={`${
                  currentInterval === 1
                    ? 'bg-blue-600 ring-blue-300/50'
                    : 'bg-orange-600 ring-orange-300/50'
                } text-white w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full flex items-center justify-center shadow-2xl ring-4` }>
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-none">
                    {currentInterval}
                  </span>
                </div>
              </div>
            )}

            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-xs sm:text-sm bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm border border-gray-200 dark:border-gray-700 z-10">
              <span className="font-medium">
                {awaitingResponse ? "Respond: 1 or 2" : running ? "Presenting…" : "Idle"}
              </span>
            </div>
          </div>
        </div>

          {/* Side Panel - Status and Instructions */}
          <div className="flex flex-col gap-2 sm:gap-3 w-full lg:w-80 flex-shrink-0">
            {/* Status Grid */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-2 sm:p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                    Trials
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                    {trialNum}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                    Correct
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">
                    {stats.correct}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                    Incorrect
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
                    {stats.incorrect}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                    Reversals
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                    {reversals.length}
                  </div>
                </div>
                <div className="text-center col-span-2 sm:col-span-3 lg:col-span-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                    Threshold (est.)
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                    {estThreshold ? `${estThreshold.toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions & Safety - Compact on desktop */}
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
          </div>
        </div>
      </div>
  );
}
