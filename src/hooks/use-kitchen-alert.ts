"use client";

import { useEffect, useRef } from "react";

/**
 * Rings a short two-tone chime and flashes the tab title when the number of
 * NEW (pending) tickets increases. WebAudio oscillators — zero asset files,
 * works offline, respects the browser's autoplay policy (silently skips
 * until the user has interacted with the page once).
 */
export function useKitchenAlert(pendingCount: number, enabled = true) {
  const previous = useRef<number | null>(null);
  const contextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // first render: baseline, no ring for tickets that were already there
    if (previous.current === null) {
      previous.current = pendingCount;
      return;
    }

    if (pendingCount > previous.current) {
      chime(contextRef);
      flashTitle();
    }
    previous.current = pendingCount;
  }, [pendingCount, enabled]);
}

function chime(contextRef: React.MutableRefObject<AudioContext | null>) {
  try {
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    if (!contextRef.current) contextRef.current = new AudioContextCtor();
    const context = contextRef.current;
    if (context.state === "suspended") void context.resume();

    const now = context.currentTime;
    [
      { frequency: 880, start: 0, duration: 0.18 },
      { frequency: 1174.66, start: 0.2, duration: 0.28 },
    ].forEach(({ frequency, start, duration }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.28, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now + start);
      oscillator.stop(now + start + duration + 0.05);
    });
  } catch {
    /* autoplay blocked or no audio — visual flash still happens */
  }
}

let flashTimer: ReturnType<typeof setInterval> | null = null;

function flashTitle() {
  if (typeof document === "undefined" || flashTimer) return;
  const original = document.title;
  let on = false;
  flashTimer = setInterval(() => {
    document.title = on ? original : "🔔 New order!";
    on = !on;
  }, 900);
  const stop = () => {
    if (flashTimer) clearInterval(flashTimer);
    flashTimer = null;
    document.title = original;
    document.removeEventListener("visibilitychange", stop);
  };
  document.addEventListener("visibilitychange", stop);
  setTimeout(stop, 10_000);
}
