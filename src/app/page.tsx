'use client';

import React, { useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { NoteList } from '@/components/NoteList';
import { NoteEditor } from '@/components/NoteEditor';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { ConfirmModal } from '@/components/ConfirmModal';

import { useAppStore } from '@/store/useAppStore';
import { useNotes } from '@/hooks/useNotes';

export default function Home() {
  // Store state & actions
  const {
    activeView,
    setActiveView,
    activeTag,
    setActiveTag,
    searchQuery,
    setSearchQuery,
    selectedNoteId,
    setSelectedNoteId,
    isNewNoteMode,
    setIsNewNoteMode,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    colorTheme,
    setColorTheme,
    fontTheme,
    setFontTheme,
    user,
    setUser,
    isSettingsOpen,
    openSettings,
    closeSettings,
    authModal,
    openAuthModal,
    closeAuthModal,
    isForgotPasswordOpen,
    openForgotPassword,
    closeForgotPassword,
    noteToDeleteId,
    setNoteToDeleteId,
  } = useAppStore();

  // Server state & mutations via TanStack Query
  const { notes, saveNote, archiveToggle, deleteNote } = useNotes();

  // Initial load: restore themes from localStorage & check auth status
  useEffect(() => {
    const savedTheme = localStorage.getItem('inkwell_color_theme');
    const savedFont = localStorage.getItem('inkwell_font_theme');
    if (savedTheme) setColorTheme(savedTheme);
    if (savedFont) setFontTheme(savedFont);

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (data.user.colorTheme) setColorTheme(data.user.colorTheme);
          if (data.user.fontTheme) setFontTheme(data.user.fontTheme);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    checkAuth();
  }, [setColorTheme, setFontTheme, setUser]);

  // Global Keyboard Shortcuts (Cmd+N for New Note)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate unique tags & counts across all notes
  const noteCounts = useMemo(() => {
    let allCount = 0;
    let archivedCount = 0;
    const tagsMap: Record<string, number> = {};

    notes.forEach((n) => {
      if (n.isArchived) archivedCount++;
      else allCount++;

      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => {
          tagsMap[t] = (tagsMap[t] || 0) + 1;
        });
      }
    });

    return { all: allCount, archived: archivedCount, tagsMap };
  }, [notes]);

  const uniqueTags = useMemo(() => {
    return Object.keys(noteCounts.tagsMap).sort();
  }, [noteCounts]);

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsNewNoteMode(true);
  };

  const handleSaveNote = async (noteData: {
    id?: string;
    title: string;
    content: string;
    tags: string[];
    isArchived: boolean;
  }) => {
    await saveNote(noteData);
    setIsNewNoteMode(false);
  };

  const handleArchiveToggle = async (id: string, currentArchived: boolean) => {
    await archiveToggle({ id, isArchived: !currentArchived });
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDeleteId) return;
    await deleteNote(noteToDeleteId);
    if (selectedNoteId === noteToDeleteId) {
      setSelectedNoteId(null);
    }
    setNoteToDeleteId(null);
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setUser(null);
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-(--bg-main) font-(--font-family-active)">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onSelectView={(v) => {
          setActiveView(v);
          setIsNewNoteMode(false);
        }}
        tags={uniqueTags}
        activeTag={activeTag}
        onSelectTag={(t) => {
          setActiveTag(t);
          setIsNewNoteMode(false);
        }}
        onNewNote={handleNewNote}
        onOpenSettings={openSettings}
        user={user}
        onOpenAuth={(view = 'login') => openAuthModal(view)}
        onLogout={handleLogout}
        noteCounts={noteCounts}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* 2. Middle Note Directory Column */}
      <NoteList
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => {
          setSelectedNoteId(id);
          setIsNewNoteMode(false);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeTag={activeTag}
        onClearTag={() => setActiveTag(null)}
        activeView={activeView}
        onNewNote={handleNewNote}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
      />

      {/* 3. Right Main Note Editor / Reader Panel */}
      <NoteEditor
        note={selectedNote}
        onSaveNote={handleSaveNote}
        onArchiveToggle={handleArchiveToggle}
        onDeleteNote={(id) => setNoteToDeleteId(id)}
        onBackMobile={() => setSelectedNoteId(null)}
        isNewNoteMode={isNewNoteMode}
      />

      {/* Modals & Dialogs */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        colorTheme={colorTheme}
        fontTheme={fontTheme}
        onSelectColorTheme={async (t) => {
          setColorTheme(t);
          if (user) {
            await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'update-settings', colorTheme: t }),
            });
          }
        }}
        onSelectFontTheme={async (f) => {
          setFontTheme(f);
          if (user) {
            await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'update-settings', fontTheme: f }),
            });
          }
        }}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        initialView={authModal.view}
        onClose={closeAuthModal}
        onAuthSuccess={(u) => {
          setUser(u);
        }}
        onOpenForgotPassword={openForgotPassword}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={closeForgotPassword}
        onOpenLogin={() => openAuthModal('login')}
      />

      <ConfirmModal
        isOpen={Boolean(noteToDeleteId)}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmLabel="Delete Note"
        onConfirm={handleDeleteConfirm}
        onClose={() => setNoteToDeleteId(null)}
      />
    </div>
  );
}
