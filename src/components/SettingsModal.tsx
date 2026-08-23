'use client';

import React, { useEffect } from 'react';
import { X, Moon, Sun, Coffee, Palette, Type, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colorTheme: string;
  fontTheme: string;
  onSelectColorTheme: (theme: string) => void;
  onSelectFontTheme: (font: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  colorTheme,
  fontTheme,
  onSelectColorTheme,
  onSelectFontTheme,
}: SettingsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const COLOR_OPTIONS = [
    { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Deep slate navy with cyan accents' },
    { id: 'light', label: 'Light Mode', icon: Sun, desc: 'Clean white canvas with sky blue' },
    { id: 'sepia', label: 'Sepia / Warm', icon: Coffee, desc: 'Cozy warm paper tone with amber' },
    { id: 'slate', label: 'Slate Royal', icon: Palette, desc: 'Cool midnight slate with blue' },
  ];

  const FONT_OPTIONS = [
    { id: 'sans', label: 'Sans-serif (Inter)', sample: 'Clean, modern, geometric' },
    { id: 'serif', label: 'Serif (Lora)', sample: 'Classic, editorial, elegant' },
    { id: 'mono', label: 'Monospace (Fira Code)', sample: 'Technical, code-friendly' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="w-full max-w-lg bg-(--bg-surface) border border-(--border-color) rounded-xl shadow-2xl overflow-hidden p-6 space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-(--border-color) pb-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-(--primary)" />
            <h2 id="settings-modal-title" className="text-xl font-bold text-(--text-main)">
              Appearance & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover) btn-interactive focus-ring"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-(--text-main) flex items-center space-x-2">
            <Palette className="w-4 h-4 text-(--primary)" />
            <span>Color Theme</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COLOR_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = colorTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectColorTheme(opt.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border btn-interactive focus-ring ${
                    isSelected
                      ? 'border-(--primary) bg-(--primary)/10 ring-1 ring-(--primary)'
                      : 'border-(--border-color) bg-(--bg-card) hover:bg-(--bg-surface-hover)'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-(--primary)" />
                      <span className="font-semibold text-sm text-(--text-main)">
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-(--primary)" />}
                  </div>
                  <span className="text-xs text-(--text-muted)">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Theme Selector */}
        <div className="space-y-3 pt-2 border-t border-(--border-color)">
          <label className="text-sm font-semibold text-(--text-main) flex items-center space-x-2">
            <Type className="w-4 h-4 text-(--primary)" />
            <span>Font Theme</span>
          </label>
          <div className="space-y-2">
            {FONT_OPTIONS.map((opt) => {
              const isSelected = fontTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectFontTheme(opt.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left btn-interactive focus-ring ${
                    isSelected
                      ? 'border-(--primary) bg-(--primary)/10 ring-1 ring-(--primary)'
                      : 'border-(--border-color) bg-(--bg-card) hover:bg-(--bg-surface-hover)'
                  }`}
                >
                  <div>
                    <span className="block font-semibold text-sm text-(--text-main)">
                      {opt.label}
                    </span>
                    <span className="text-xs text-(--text-muted)">{opt.sample}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyboard navigation quick tips */}
        <div className="p-3 bg-(--bg-surface-hover) rounded-lg text-xs text-(--text-muted) space-y-1">
          <span className="font-semibold block text-(--text-main)">Keyboard Shortcuts:</span>
          <div className="grid grid-cols-2 gap-1 pt-1">
            <div><kbd className="px-1.5 py-0.5 bg-(--bg-main) rounded border border-(--border-color) font-mono">Cmd+N</kbd> New Note</div>
            <div><kbd className="px-1.5 py-0.5 bg-(--bg-main) rounded border border-(--border-color) font-mono">Cmd+S</kbd> Save Note</div>
            <div><kbd className="px-1.5 py-0.5 bg-(--bg-main) rounded border border-(--border-color) font-mono">/</kbd> Focus Search</div>
            <div><kbd className="px-1.5 py-0.5 bg-(--bg-main) rounded border border-(--border-color) font-mono">Esc</kbd> Close Dialog</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-(--primary) text-(--primary-contrast) hover:opacity-90 btn-interactive focus-ring"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
