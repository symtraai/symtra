'use client';

import { useEffect, useRef, useState } from 'react';

interface TerminalTextProps {
  text: string;
  speed?: number;
  className?: string;
  onComplete?: () => void;
  startDelay?: number;
}

export default function TerminalText({
  text,
  speed = 25,
  className = '',
  onComplete,
  startDelay = 0,
}: TerminalTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(startDelay === 0);

  useEffect(() => {
    if (startDelay > 0) {
      const t = setTimeout(() => setStarted(true), startDelay);
      return () => clearTimeout(t);
    }
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (index >= text.length) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setDisplayed((prev) => prev + text[index]);
      setIndex((i) => i + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [index, text, speed, onComplete, started]);

  // Reset when text/delay changes — use a ref to batch resets outside render
  const resetRef = useRef(false);
  useEffect(() => {
    resetRef.current = true;
    const frame = requestAnimationFrame(() => {
      if (resetRef.current) {
        setDisplayed('');
        setIndex(0);
        setStarted(startDelay === 0);
        resetRef.current = false;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [text, startDelay]);

  return (
    <span className={className}>
      {displayed}
      {index < text.length && started && (
        <span className="terminal-cursor">█</span>
      )}
    </span>
  );
}
