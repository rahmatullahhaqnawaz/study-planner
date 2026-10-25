import { useEffect, useRef, useState } from "react";

// A focus timer that keeps running while you switch pages.
// It stores the end time, so it stays accurate even if the tab sleeps.
export default function useFocusTimer(onSessionDone) {
  const [length, setLength] = useState(25);          // minutes
  const [endAt, setEndAt] = useState(null);           // timestamp when running
  const [pausedLeft, setPausedLeft] = useState(null); // seconds left when paused
  const [now, setNow] = useState(Date.now());
  const doneRef = useRef(onSessionDone);
  doneRef.current = onSessionDone;

  const running = endAt !== null;
  const secondsLeft = running
    ? Math.max(0, Math.round((endAt - now) / 1000))
    : pausedLeft ?? length * 60;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [running]);

  // Session finished: log it and reset
  useEffect(() => {
    if (running && secondsLeft === 0) {
      setEndAt(null);
      setPausedLeft(null);
      doneRef.current(length);
    }
  }, [running, secondsLeft, length]);

  return {
    length,
    secondsLeft,
    running,
    percent: 100 - (secondsLeft / (length * 60)) * 100,
    start() {
      setNow(Date.now());
      setEndAt(Date.now() + secondsLeft * 1000);
    },
    pause() {
      setPausedLeft(secondsLeft);
      setEndAt(null);
    },
    // Stop early: log the whole minutes already done
    reset() {
      const minutesDone = Math.floor((length * 60 - secondsLeft) / 60);
      if (minutesDone >= 1) doneRef.current(minutesDone);
      setEndAt(null);
      setPausedLeft(null);
    },
    setLength(min) {
      if (running) return;
      setLength(min);
      setPausedLeft(null);
    },
  };
}
