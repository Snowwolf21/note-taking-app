'use client';

import React, { useRef, useEffect } from 'react';
import { Search, Plus, Tag, Calendar, Archive, FileText, Menu, X } from 'lucide-react';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NoteListProps {
  notes: NoteItem[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTag: string | null;
  onClearTag: () => void;
  activeView: 'all' | 'archived';
  onNewNote: () => void;
  onOpenMobileSidebar: () => void;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  searchQuery,
  onSearchChange,
  activeTag,
  onClearTag,
  activeView,
  onNewNote,
  onOpenMobileSidebar,
}: NoteListProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut `/` to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Keyboard Arrow Key Navigation (Up/Down) within note list
  const handleListKeyDown = (e: React.KeyboardEvent) => {
    if (notes.length === 0) return;
    const currentIndex = notes.findIndex((n) => n.id === selectedNoteId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % notes.length;
      onSelectNote(notes[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + notes.length) % notes.length;
      onSelectNote(notes[prevIndex].id);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="w-full lg:w-80 xl:w-96 bg-[var(--bg-surface)] border-r border-[var(--border-color)] flex flex-col h-full shrink-0"
      aria-label="Notes Directory"
    >
      {/* Header section with search and title */}
      <div className="p-4 space-y-3 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMobileSidebar}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] lg:hidden focus-ring"
              aria-label="Open sidebar drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[var(--text-main)] capitalize">
              {activeView === 'archived' ? 'Archived Notes' : 'All Notes'}
            </h2>
          </div>
          <button
            onClick={onNewNote}
            className="p-2 bg-[var(--primary)] text-[var(--primary-contrast)] rounded-xl hover:opacity-90 transition-opacity focus-ring shadow-sm"
            title="Create New Note (Cmd+N)"
            aria-label="Create New Note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search title, content, or tags... (/)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-[var(--text-main)] placeholder-[var(--text-muted)] focus-ring"
            aria-label="Search notes by title, tag, or content"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-main)] focus-ring p-0.5 rounded"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active Tag Filter Indicator */}
        {activeTag && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg text-xs">
            <span className="flex items-center space-x-1 font-semibold text-[var(--primary)]">
              <Tag className="w-3.5 h-3.5" />
              <span>Tag filter: #{activeTag}</span>
            </span>
            <button
              onClick={onClearTag}
              className="text-[var(--primary)] hover:underline focus-ring text-xs font-bold"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Note List Scrollable Container */}
      <div
        ref={listRef}
        onKeyDown={handleListKeyDown}
        tabIndex={0}
        role="region"
        aria-label="Note List Items (Use Up and Down Arrow keys to navigate)"
        className="flex-1 overflow-y-auto p-3 space-y-2 focus-ring outline-none"
      >
        {notes.length === 0 ? (
          <div className="p-8 text-center space-y-3 text-[var(--text-muted)] my-auto">
            {activeView === 'archived' ? (
              <Archive className="w-10 h-10 mx-auto opacity-40 text-[var(--primary)]" />
            ) : (
              <FileText className="w-10 h-10 mx-auto opacity-40 text-[var(--primary)]" />
            )}
            <p className="text-sm font-medium">No notes found.</p>
            <p className="text-xs">
              {searchQuery || activeTag
                ? 'Try adjusting your search terms or clearing the tag filter.'
                : 'Click "Create New Note" to start writing!'}
            </p>
          </div>
        ) : (
          notes.map((note) => {
            const isSelected = selectedNoteId === note.id;
            const snippet = note.content.replace(/[#*`_]/g, '').slice(0, 90);

            return (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all duration-150 focus-ring space-y-2 ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-1 ring-[var(--primary)] shadow-sm'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface-hover)]'
                }`}
                aria-selected={isSelected}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-[var(--text-main)] line-clamp-1">
                    {note.title || 'Untitled Note'}
                  </h3>
                  {note.isArchived && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 shrink-0">
                      Archived
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                  {snippet || 'Empty note content...'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>

                  {Array.isArray(note.tags) && note.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-[var(--primary)]" />
                      <span className="truncate max-w-[120px] font-medium text-[var(--text-main)]">
                        {note.tags.join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
