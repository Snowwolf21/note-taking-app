'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings } from 'lucide-react';

interface FloatingSettingsWidgetProps {
  onOpenSettings: () => void;
}

export function FloatingSettingsWidget({ onOpenSettings }: FloatingSettingsWidgetProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const widgetRef = useRef<HTMLButtonElement>(null);

  const prevBracketRef = useRef<string | null>(null);

  // Helper to determine viewport category (mobile < 768px, tablet 768-1023px, desktop >= 1024px)
  const getViewportBracket = (width: number) => {
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  };

  // Reset position to initial default (bottom-6 right-6) whenever viewport breakpoint changes
  useEffect(() => {
    prevBracketRef.current = getViewportBracket(window.innerWidth);

    const handleResize = () => {
      const currentBracket = getViewportBracket(window.innerWidth);
      if (prevBracketRef.current && prevBracketRef.current !== currentBracket) {
        // Viewport crossed breakpoint boundary -> return to initial position
        setPosition(null);
        prevBracketRef.current = currentBracket;
      } else if (position) {
        // Same bracket -> clamp position within screen bounds
        const maxX = window.innerWidth - 64;
        const maxY = window.innerHeight - 64;
        setPosition((prev) =>
          prev
            ? {
                x: Math.min(Math.max(16, prev.x), maxX),
                y: Math.min(Math.max(16, prev.y), maxY),
              }
            : null
        );
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Global mouse / touch move and release listeners while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (clientX: number, clientY: number) => {
      hasMovedRef.current = true;
      const newX = clientX - dragOffsetRef.current.x;
      const newY = clientY - dragOffsetRef.current.y;

      const maxX = window.innerWidth - 64;
      const maxY = window.innerHeight - 64;

      setPosition({
        x: Math.min(Math.max(12, newX), maxX),
        y: Math.min(Math.max(12, newY), maxY),
      });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging]);

  const handleStart = (clientX: number, clientY: number) => {
    if (!widgetRef.current) return;
    const rect = widgetRef.current.getBoundingClientRect();
    if (!position) {
      setPosition({ x: rect.left, y: rect.top });
    }
    dragOffsetRef.current = {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
    hasMovedRef.current = false;
    setIsDragging(true);
  };

  const handleClick = () => {
    // Only trigger modal click if the user didn't drag the widget
    if (!hasMovedRef.current) {
      onOpenSettings();
    }
  };

  const styleObj = position
    ? { left: `${position.x}px`, top: `${position.y}px` }
    : undefined;

  return (
    <button
      ref={widgetRef}
      onClick={handleClick}
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }
      }}
      style={styleObj}
      className={`fixed  z-50 p-1.5 md:p-2 lg:p-2.5 bg-(--primary) text-(--primary-contrast) rounded-full shadow-2xl border border-white/20 focus-ring cursor-grab active:cursor-grabbing select-none transition-transform duration-75 btn-interactive ${
        !position ? 'bottom-6 right-6' : ''
      } ${
        isDragging ? 'scale-105 shadow-2xl ring-4 ring-(--primary)/50' : 'hover:scale-105 ring-2 ring-(--primary)/40'
      }`}
      title="Drag anywhere or click for Settings & Themes"
      aria-label="Appearance & Theme Settings Widget (Draggable)"
    >
      <Settings className={`w-8 h-8 ${isDragging ? 'animate-spin' : ''}`} />
    </button>
  );
}
