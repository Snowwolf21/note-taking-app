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

  // Set initial position at bottom-right corner on first client render
  useEffect(() => {
    const initialX = Math.max(16, window.innerWidth - 80);
    const initialY = Math.max(16, window.innerHeight - 80);
    setPosition({ x: initialX, y: initialY });
  }, []);

  // Recalculate clamped position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!position) return;
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

  if (!position) return null;

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
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      className={`fixed z-50 p-3.5 bg-(--primary) text-(--primary-contrast) rounded-full shadow-2xl border border-white/20 focus-ring cursor-grab active:cursor-grabbing select-none transition-transform duration-75 btn-interactive ${
        isDragging ? 'scale-110 shadow-2xl ring-4 ring-(--primary)/50' : 'hover:scale-105 ring-2 ring-(--primary)/40'
      }`}
      title="Drag anywhere or click for Settings & Themes"
      aria-label="Appearance & Theme Settings Widget (Draggable)"
    >
      <Settings className={`w-6 h-6 ${isDragging ? 'animate-spin' : ''}`} />
    </button>
  );
}
