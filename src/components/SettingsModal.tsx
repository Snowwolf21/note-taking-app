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
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden p-6 space-y-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center space-x-2">
            <Palette className="w-5 h-5 text-[var(--primary)]" />
            <h2 id="settings-modal-title" className="text-xl font-bold text-[var(--text-main)]">
              Appearance & Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] focus-ring"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Color Theme Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-[var(--text-main)] flex items-center space-x-2">
            <Palette className="w-4 h-4 text-[var(--primary)]" />
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
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all duration-150 focus-ring ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-semibold text-sm text-[var(--text-main)]">
                        {opt.label}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Theme Selector */}
        <div className="space-y-3 pt-2 border-t border-[var(--border-color)]">
          <label className="text-sm font-semibold text-[var(--text-main)] flex items-center space-x-2">
            <Type className="w-4 h-4 text-[var(--primary)]" />
            <span>Font Theme</span>
          </label>
          <div className="space-y-2">
            {FONT_OPTIONS.map((opt) => {
              const isSelected = fontTheme === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onSelectFontTheme(opt.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-150 focus-ring ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div>
                    <span className="block font-semibold text-sm text-[var(--text-main)]">
                      {opt.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">{opt.sample}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[var(--primary)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyboard navigation quick tips */}
        <div className="p-3 bg-[var(--bg-surface-hover)] rounded-lg text-xs text-[var(--text-muted)] space-y-1">
          <span className="font-semibold block text-[var(--text-main)]">Keyboard Shortcuts:</span>
          <div className="grid grid-cols-2 gap-1 pt-1">
            <div><kbd className="px-1.5 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)] font-mono">Cmd+N</kbd> New Note</div>
            <div><kbd className="px-1.5 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)] font-mono">Cmd+S</kbd> Save Note</div>
            <div><kbd className="px-1.5 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)] font-mono">/</kbd> Focus Search</div>
            <div><kbd className="px-1.5 py-0.5 bg-[var(--bg-main)] rounded border border-[var(--border-color)] font-mono">Esc</kbd> Close Dialog</div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-[var(--primary)] text-[var(--primary-contrast)] hover:opacity-90 focus-ring"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
