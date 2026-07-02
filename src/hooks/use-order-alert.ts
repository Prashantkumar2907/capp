"use client";

import { useEffect, useRef } from "react";

/**
 * Plays a short ascending two-tone beep via the Web Audio API when the
 * count of active orders increases.  Used by both the Orders and Kitchen
 * pages so the sound logic lives in one place.
 *
 * @param count   Current number of active orders (e.g. kitchen queue length).
 * @param enabled Whether sound alerts are currently enabled.
 */
export function useOrderAlert(count: number, enabled: boolean): void {
  const prevCount = useRef(0);

  useEffect(() => {
    if (count > prevCount.current && prevCount.current > 0 && enabled) {
      try {
        const ctx = new AudioContext();

        const playTone = (freq: number, startAt: number, duration: number, gain: number) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.connect(g);
          g.connect(ctx.destination);
          osc.frequency.value = freq;
          g.gain.value = gain;
          osc.start(ctx.currentTime + startAt);
          osc.stop(ctx.currentTime + startAt + duration);
        };

        playTone(880, 0, 0.3, 0.4);
        playTone(1100, 0.25, 0.2, 0.3);
      } catch {
        // AudioContext may be blocked before user interaction — ignore silently.
      }
    }

    prevCount.current = count;
  }, [count, enabled]);
}
