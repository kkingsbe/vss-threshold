# Visual Snow Syndrome: Experimental Basis for Threshold Testing

## 1. Why Use Dynamic Noise Patterns?

Research into VSS shows that patients often have:

* **Increased sensitivity** to temporally varying (flickering) patterns.
* Most robust differences appear for **dynamic random-noise fields** (similar to "TV static"), especially at **temporal frequencies around 10–15 Hz**.
* By presenting external noise, we can probe how faint the stimulus can be before detection drops to chance — a proxy for how sensitive the visual system is to snow-like signals.

---

## 2. Stimulus Parameters

### Spatial Scale

* Typical experiments use **small dots/blocks** (1–3 px at normal viewing distance) to approximate fine-grain snow.
* In our demo, we set block size to ~2 px — consistent with psychophysics norms.

### Temporal Frequency

* Studies show that VSS differences peak in the **10–15 Hz flicker range**.
* This is why we locked the app to **15 Hz frame updates** for the noise.

### Contrast

* The only adaptive variable.
* Staircases adjust the **contrast (%)** of the noise relative to background, estimating the lowest level detectable above chance.

---

## 3. Interval Design

### Why Two-Interval Forced Choice (2IFC)?

* Forces the participant to pick an interval, even if unsure.
* Removes bias from "criterion shifts" (e.g., a tendency to say "yes" more often).
* Guessing is expected, but across trials the staircase converges on the point where the signal is *just strong enough* to drive accuracy above chance (~75% correct).

### Duration

* Published experiments often use **short intervals (300–600 ms)** to prevent visual adaptation and to keep working memory load low.
* We use **jittered 400–600 ms intervals**: long enough to see the pattern, but short enough to avoid adaptation.

### Separation Between Intervals

* A **mid-gray blank (300 ms)** provides temporal separation and prevents afterimages.
* Simple blank is preferred over pattern masks to avoid introducing afterimage artifacts.

---

## 4. Adaptation & Exposure Effects

* **Prolonged viewing** (30–60 s of high-contrast static) can temporarily reduce subjective snow for some VSS patients.
* This effect decays over minutes but demonstrates that **exposure length changes detectability**.
* In threshold tasks:

  * **Short intervals (≤600 ms)** avoid adaptation, ensuring thresholds measure sensitivity, not fatigue.
  * **Longer exposures (2–4 s)** may artificially lower detectability by adapting the visual system.

---

## 5. Staircase Logic

* **2-down/1-up staircase** is used in this implementation:

  * 2 consecutive correct → lower contrast (make harder).
  * 1 incorrect → raise contrast (make easier).
* This method converges around **~70.7% accuracy**, providing more reliable threshold estimates than 1-up/1-down.
* This is a standard approach in psychophysics for estimating detection thresholds.

---

## 6. What the Threshold Means

* **Threshold (e.g., 5%)** = the contrast at which the participant can detect snow reliably above chance.
* **Healthy controls**: usually ~15–30% in this kind of demo.
* **VSS participants**: often single-digit thresholds, reflecting heightened sensitivity to faint noise.

---

## 7. Recent Improvements (v2)

### Fixed Mean Luminance
* Noise now uses **zero-mean modulation** around mid-gray (127.5) instead of unipolar [0, 255].
* This eliminates brightness cues — both intervals have identical mean luminance.

### Mid-Gray Background
* All frames (blank, intervals, fixation) use **mid-gray (RGB 127, 127, 127)** instead of white.
* Prevents participants from using "overall brightness" as a detection strategy.

### Unified Interval Markers
* Both intervals use the **same neutral fixation point** (dark gray dot).
* **Removed large colored 1/2 badges** during stimulus presentation to eliminate visual differences.
* Intervals are now perceptually identical except for the presence/absence of noise.
* Fixation dot is **always visible** (drawn on top of noise) to maintain a consistent focus point.

### Jittered Timing
* **Interval duration**: randomized 400–600 ms per trial.
* **ISI duration**: randomized 250–450 ms per trial.
* Reduces predictability and temporal cueing strategies.

### Adaptive Step Size
* Step size **starts at 6%** for rapid initial convergence.
* **Shrinks to 4%** after 2 reversals.
* **Shrinks to 2%** after 4 reversals for fine-grained threshold estimation.
* Provides faster convergence early on, with precision when near threshold.

### Immediate Stimulus Onset
* Noise appears **immediately at interval onset** (no pre-noise delay).
* First frame rendered at t=0, then continues at 15 Hz.
* **No temporal ramping** — abrupt onset/offset to maintain strict mean luminance equality.
* Temporal ramps were found to introduce subtle brightness cues at low contrasts due to clipping artifacts.

---

## 8. Remaining Limitations

* Not luminance-calibrated → percentages are relative, not absolute.
* Few reversals → estimate can still be noisy with high between-session variability.
* Single temporal frequency (15 Hz) — VSS sensitivity may vary across frequencies.
* Abrupt onsets may be slightly more detectable than ramped stimuli, but necessary to avoid brightness confounds.
