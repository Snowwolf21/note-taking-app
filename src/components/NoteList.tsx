'use client';

import React, { useRef, useEffect, useState } from 'react';
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
  onSelectTag?: (tag: string | null) => void;
  onClearTag: () => void;
  activeView: 'all' | 'archived';
  onNewNote: () => void;
  onOpenMobileSidebar: () => void;
  isNewNoteMode?: boolean;
}

export function NoteList({
  notes,
  selectedNoteId,
  onSelectNote,
  searchQuery,
  onSearchChange,
  activeTag,
  onSelectTag,
  onClearTag,
  activeView,
  onNewNote,
  onOpenMobileSidebar,
  isNewNoteMode = false,
}: NoteListProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Extract unique available tags for horizontal pill navigation
  const availableTags = Array.from(
    new Set(notes.flatMap((n) => (Array.isArray(n.tags) ? n.tags : [])))
  );

  // Sync local search state when prop changes externally (e.g. cleared)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  // Debounce search input by 300ms before calling parent onSearchChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

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
      className={`w-full md:w-80 xl:w-96 bg-(--bg-surface) border-r border-(--border-color) flex-col h-full shrink-0 relative ${
        selectedNoteId !== null || isNewNoteMode ? 'hidden md:flex' : 'flex'
      }`}
      aria-label="Notes Directory"
    >
      {/* Header section with search and title */}
      <div className="p-4 space-y-3 border-b border-(--border-color)">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenMobileSidebar}
              className="p-1.5 rounded-lg text-(--text-main) bg-(--bg-card) border border-(--border-color) hover:bg-(--bg-surface-hover) lg:hidden btn-interactive focus-ring shadow-xs flex items-center justify-center"
              aria-label="Open sidebar drawer"
              title="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-(--primary)" />
            </button>
            <h2 className="text-xl font-bold text-(--text-main) capitalize">
              {activeView === 'archived' ? 'Archived Notes' : 'All Notes'}
            </h2>
          </div>
          <button
            onClick={onNewNote}
            className="p-2 bg-(--primary) text-(--primary-contrast) rounded-xl hover:opacity-90 btn-interactive focus-ring shadow-sm"
            title="Create New Note (Cmd+N)"
            aria-label="Create New Note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Real-time Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-(--text-muted) pointer-events-none" />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Search title, content, or tags... (/)"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-(--bg-card) border border-(--border-color) rounded-xl text-(--text-main) placeholder-(--text-muted) focus-ring"
            aria-label="Search notes by title, tag, or content"
          />
        </div>

        {/* Horizontal Scrollable Tag Pills Bar */}
        {availableTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none scroll-smooth">
            <button
              onClick={onClearTag}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 btn-interactive focus-ring transition-colors ${
                activeTag === null
                  ? 'bg-(--primary) text-(--primary-contrast) shadow-xs'
                  : 'bg-(--bg-card) text-(--text-muted) border border-(--border-color) hover:text-(--text-main)'
              }`}
            >
              #All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => (onSelectTag ? onSelectTag(tag) : null)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg shrink-0 btn-interactive focus-ring transition-colors ${
                  activeTag === tag
                    ? 'bg-(--primary) text-(--primary-contrast) shadow-xs'
                    : 'bg-(--bg-card) text-(--text-muted) border border-(--border-color) hover:text-(--text-main)'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Active Tag Filter Indicator */}
        {activeTag && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-(--primary)/10 border border-(--primary)/30 rounded-lg text-xs">
            <span className="flex items-center space-x-1 font-semibold text-(--primary)">
              <Tag className="w-3.5 h-3.5" />
              <span>Tag filter: #{activeTag}</span>
            </span>
            <button
              onClick={onClearTag}
              className="text-(--primary) hover:underline btn-interactive focus-ring text-xs font-bold"
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
          <div className="p-8 text-center space-y-3 text-(--text-muted) my-auto">
            {activeView === 'archived' ? (
              <Archive className="w-10 h-10 mx-auto opacity-40 text-(--primary)" />
            ) : (
              <FileText className="w-10 h-10 mx-auto opacity-40 text-(--primary)" />
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
                className={`w-full text-left p-3.5 rounded-xl border btn-interactive focus-ring space-y-2 ${
                  isSelected
                    ? 'border-(--primary) bg-(--primary)/10 ring-1 ring-(--primary) shadow-sm font-semibold'
                    : 'border-(--border-color) bg-(--bg-card) hover:bg-(--bg-surface-hover)'
                }`}
                aria-selected={isSelected}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-(--text-main) line-clamp-1">
                    {note.title || 'Untitled Note'}
                  </h3>
                  {note.isArchived && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-amber-500/10 text-amber-500 border border-amber-500/30 shrink-0">
                      Archived
                    </span>
                  )}
                </div>

                <p className="text-xs text-(--text-muted) line-clamp-2 leading-relaxed">
                  {snippet || 'Empty note content...'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-(--text-muted) pt-1">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>

                  {Array.isArray(note.tags) && note.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3 text-(--primary)" />
                      <span className="truncate max-w-30 font-medium text-(--text-main)">
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

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={onNewNote}
        className="md:hidden fixed bottom-6 right-6 z-30 p-4 bg-(--primary) text-(--primary-contrast) rounded-full shadow-2xl btn-interactive focus-ring flex items-center justify-center ring-2 ring-(--primary)/50"
        aria-label="Create New Note"
        title="Create New Note"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
