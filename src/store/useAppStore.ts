'use client';

import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  colorTheme: string;
  fontTheme: string;
}

type AuthModalView = 'login' | 'register' | 'changePassword';

interface AppState {
  // ── Navigation ────────────────────────────────────────────────────────────
  activeView: 'all' | 'archived';
  activeTag: string | null;
  searchQuery: string;
  selectedNoteId: string | null;
  isNewNoteMode: boolean;
  mobileSidebarOpen: boolean;

  // ── Themes ────────────────────────────────────────────────────────────────
  colorTheme: string;
  fontTheme: string;

  // ── Auth ──────────────────────────────────────────────────────────────────
  user: AuthUser | null;

  // ── Modals ────────────────────────────────────────────────────────────────
  isSettingsOpen: boolean;
  authModal: { isOpen: boolean; view: AuthModalView };
  isForgotPasswordOpen: boolean;
  noteToDeleteId: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setActiveView: (view: 'all' | 'archived') => void;
  setActiveTag: (tag: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSelectedNoteId: (id: string | null) => void;
  setIsNewNoteMode: (v: boolean) => void;
  setMobileSidebarOpen: (v: boolean) => void;

  setColorTheme: (theme: string) => void;
  setFontTheme: (font: string) => void;

  setUser: (user: AuthUser | null) => void;

  openSettings: () => void;
  closeSettings: () => void;
  openAuthModal: (view?: AuthModalView) => void;
  closeAuthModal: () => void;
  openForgotPassword: () => void;
  closeForgotPassword: () => void;
  setNoteToDeleteId: (id: string | null) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  // ── Navigation defaults ───────────────────────────────────────────────────
  activeView: 'all',
  activeTag: null,
  searchQuery: '',
  selectedNoteId: null,
  isNewNoteMode: false,
  mobileSidebarOpen: false,

  // ── Theme defaults (overridden from localStorage on mount in page.tsx) ────
  colorTheme: 'dark',
  fontTheme: 'sans',

  // ── Auth ──────────────────────────────────────────────────────────────────
  user: null,

  // ── Modal defaults ────────────────────────────────────────────────────────
  isSettingsOpen: false,
  authModal: { isOpen: false, view: 'login' },
  isForgotPasswordOpen: false,
  noteToDeleteId: null,

  // ── Actions ───────────────────────────────────────────────────────────────
  setActiveView: (view) => set({ activeView: view }),
  setActiveTag: (tag) => set({ activeTag: tag }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedNoteId: (id) => set({ selectedNoteId: id }),
  setIsNewNoteMode: (v) => set({ isNewNoteMode: v }),
  setMobileSidebarOpen: (v) => set({ mobileSidebarOpen: v }),

  setColorTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('inkwell_color_theme', theme);
    set({ colorTheme: theme });
  },

  setFontTheme: (font) => {
    document.documentElement.setAttribute('data-font', font);
    localStorage.setItem('inkwell_font_theme', font);
    set({ fontTheme: font });
  },

  setUser: (user) => set({ user }),

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openAuthModal: (view = 'login') => set({ authModal: { isOpen: true, view } }),
  closeAuthModal: () =>
    set((state) => ({ authModal: { ...state.authModal, isOpen: false } })),
  openForgotPassword: () => set({ isForgotPasswordOpen: true }),
  closeForgotPassword: () => set({ isForgotPasswordOpen: false }),
  setNoteToDeleteId: (id) => set({ noteToDeleteId: id }),
}));
