'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { NoteList, NoteItem } from '@/components/NoteList';
import { NoteEditor } from '@/components/NoteEditor';
import { SettingsModal } from '@/components/SettingsModal';
import { AuthModal } from '@/components/AuthModal';
import { ForgotPasswordModal } from '@/components/ForgotPasswordModal';
import { ConfirmModal } from '@/components/ConfirmModal';

export default function Home() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'all' | 'archived'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewNoteMode, setIsNewNoteMode] = useState(false);

  // Themes
  const [colorTheme, setColorTheme] = useState('dark');
  const [fontTheme, setFontTheme] = useState('sans');

  // User state
  const [user, setUser] = useState<any>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState<{
    isOpen: boolean;
    view: 'login' | 'register' | 'changePassword';
  }>({ isOpen: false, view: 'login' });
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  // Mobile navigation drawer toggle
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // 1. Initial Load: Check Auth & Fetch Notes & Load Themes from LocalStorage
  useEffect(() => {
    // Local theme cache
    const savedTheme = localStorage.getItem('inkwell_color_theme');
    const savedFont = localStorage.getItem('inkwell_font_theme');
    if (savedTheme) setColorTheme(savedTheme);
    if (savedFont) setFontTheme(savedFont);

    checkAuth();
    fetchNotes();
  }, []);

  // Update HTML data attributes on theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', colorTheme);
    localStorage.setItem('inkwell_color_theme', colorTheme);
  }, [colorTheme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontTheme);
    localStorage.setItem('inkwell_font_theme', fontTheme);
  }, [fontTheme]);

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

  const fetchNotes = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (activeView === 'archived') queryParams.set('archived', 'true');
      if (activeTag) queryParams.set('tag', activeTag);
      if (searchQuery) queryParams.set('search', searchQuery);

      const res = await fetch(`/api/notes?${queryParams.toString()}`);
      const data = await res.json();

      if (data.notes) {
        setNotes(data.notes);
        if (data.notes.length > 0 && !selectedNoteId) {
          setSelectedNoteId(data.notes[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeView, activeTag, searchQuery]);

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
    if (noteData.id) {
      // Update existing note
      const res = await fetch(`/api/notes/${noteData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => prev.map((n) => (n.id === data.note.id ? data.note : n)));
        setIsNewNoteMode(false);
      }
    } else {
      // Create new note
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setSelectedNoteId(data.note.id);
        setIsNewNoteMode(false);
      }
    }
  };

  const handleArchiveToggle = async (id: string, currentArchived: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isArchived: !currentArchived }),
      });
      const data = await res.json();
      if (data.note) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
        fetchNotes();
      }
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!noteToDeleteId) return;
    try {
      const res = await fetch(`/api/notes/${noteToDeleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteToDeleteId));
        if (selectedNoteId === noteToDeleteId) {
          setSelectedNoteId(null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setNoteToDeleteId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setUser(null);
    fetchNotes();
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-main)] font-[var(--font-family-active)]">
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
        onOpenSettings={() => setIsSettingsOpen(true)}
        user={user}
        onOpenAuth={(view = 'login') => setAuthModalConfig({ isOpen: true, view })}
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
        onClose={() => setIsSettingsOpen(false)}
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
        isOpen={authModalConfig.isOpen}
        initialView={authModalConfig.view}
        onClose={() => setAuthModalConfig({ ...authModalConfig, isOpen: false })}
        onAuthSuccess={(u) => {
          setUser(u);
          fetchNotes();
        }}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onOpenLogin={() => setAuthModalConfig({ isOpen: true, view: 'login' })}
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
