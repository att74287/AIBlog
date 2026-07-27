import React, { useState, useRef } from 'react';

/**
 * WomanFaceCanvas Component (Pristine Real Photo Edition)
 * Displays the pristine real portrait photo (`girl2.jpg`) with ZERO visual overlays,
 * symbols, dots, or eye-tracking graphics.
 * 
 * Hidden Invisible Triggers:
 * 1. Invisible Mole Hotspot (Clicking left side below lower lip unlocks portal).
 * 2. Invisible Left Eye Hotspot (Clicking Left Eye 3 times unlocks portal).
 */
export default function WomanFaceCanvas({ onMoleClick }) {
  // Left Eye 3-click tracking state
  const [leftEyeClicks, setLeftEyeClicks] = useState(0);
  const clickTimerRef = useRef(null);

  // Handle Left Eye 3-Click Trigger (Invisible)
  const handleLeftEyeClick = (e) => {
    e.stopPropagation();

    setLeftEyeClicks((prev) => {
      const nextCount = prev + 1;
      if (nextCount >= 3) {
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        onMoleClick(); // Trigger secret unlock!
        return 0;
      }
      return nextCount;
    });

    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      setLeftEyeClicks(0);
    }, 1800);
  };

  return (
    <div
      className="relative w-full max-w-sm sm:max-w-md mx-auto aspect-[1/1.9] select-none rounded-3xl overflow-hidden shadow-2xl border border-slate-300/30 bg-slate-900"
    >
      {/* Clean Real Female Portrait Image - No visual dots, overlays, or eye graphics */}
      <img
        src="/girl2.jpg"
        alt="AI Facial Analysis Model"
        className="w-full h-full object-cover object-center"
      />

      {/* INVISIBLE LEFT EYE HOTSPOT (Click 3 times to unlock) */}
      <div
        onClick={handleLeftEyeClick}
        className="absolute top-[28%] left-[26%] w-[18%] h-[9%] rounded-full cursor-pointer z-20"
        title="AI Vision Model Area"
      />

      {/* INVISIBLE MOLE HOTSPOT (Left side below lower lip - Click 1 time to unlock) */}
      <div
        id="moleTrigger"
        onClick={(e) => {
          e.stopPropagation();
          onMoleClick();
        }}
        style={{ top: '51.8%', left: '42.8%' }}
        className="absolute w-6 h-6 -ml-3 -mt-3 cursor-pointer z-30 rounded-full"
        title="Biometric Target"
      />
    </div>
  );
}
