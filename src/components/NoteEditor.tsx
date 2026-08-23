'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Save,
  Archive,
  ArchiveRestore,
  Trash2,
  Tag as TagIcon,
  X,
  Plus,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Eye,
  Edit3,
  ArrowLeft,
  Menu,
  Lock,
} from 'lucide-react';
import { NoteItem } from './NoteList';

interface NoteEditorProps {
  note: NoteItem | null;
  onSaveNote: (updated: { id?: string; title: string; content: string; tags: string[]; isArchived: boolean }) => Promise<void>;
  onArchiveToggle: (id: string, currentArchived: boolean) => Promise<void>;
  onDeleteNote: (id: string) => void;
  onBackMobile: () => void;
  onOpenMobileSidebar?: () => void;
  isNewNoteMode?: boolean;
  isGuest?: boolean;
  onOpenAuth?: () => void;
}

export function NoteEditor({
  note,
  onSaveNote,
  onArchiveToggle,
  onDeleteNote,
  onBackMobile,
  onOpenMobileSidebar,
  isNewNoteMode = false,
  isGuest = false,
  onOpenAuth,
}: NoteEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  // Form Validation states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync state when selected note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      setTags(Array.isArray(note.tags) ? note.tags : []);
      setIsArchived(note.isArchived || false);
      setTitleError(null);
      setContentError(null);
      setSaveSuccess(null);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setIsArchived(false);
      setTitleError(null);
      setContentError(null);
    }
  }, [note]);

  // Focus title input on new note
  useEffect(() => {
    if (isNewNoteMode) {
      titleInputRef.current?.focus();
    }
  }, [isNewNoteMode]);

  // Save Keyboard Shortcut (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const handleAddTag = () => {
    const trimmed = tagInput.trim().replace(/^#/, '');
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validateForm = () => {
    let isValid = true;
    if (!title.trim()) {
      setTitleError('Title is required to save note.');
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (!content.trim()) {
      setContentError('Content cannot be blank.');
      isValid = false;
    } else {
      setContentError(null);
    }

    return isValid;
  };

  const handleSave = async () => {
    if (isGuest) {
      onOpenAuth?.();
      return;
    }
    if (!validateForm()) return;
    setSaving(true);
    setSaveSuccess(null);

    try {
      await onSaveNote({
        id: note?.id,
        title: title.trim(),
        content: content.trim(),
        tags,
        isArchived,
      });
      setSaveSuccess('Note saved successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      // Handled in parent query error
    } finally {
      setSaving(false);
    }
  };

  // Memoized character and word count calculations
  const { charCount, wordCount } = useMemo(() => {
    const trimmed = content.trim();
    return {
      charCount: content.length,
      wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
    };
  }, [content]);

  if (!note && !isNewNoteMode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-(--bg-main) space-y-4" aria-label="No Note Selected">
        <div className="p-4 bg-(--bg-surface) border border-(--border-color) rounded-2xl shadow-sm text-(--primary)">
          <Calendar className="w-10 h-10" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h2 className="text-xl font-bold text-(--text-main)">Select a note to view</h2>
          <p className="text-xs text-(--text-muted) leading-relaxed">
            Choose a note from the list on the left or create a new note to start capturing your ideas.
          </p>
        </div>
        <button
          onClick={() => {
            if (isGuest) {
              onOpenAuth?.();
              return;
            }
            // Trigger new note via focus
            const newBtn = document.querySelector('button[title*="Cmd+N"]') as HTMLButtonElement;
            newBtn?.click();
          }}
          className="px-4 py-2 bg-(--primary) text-(--primary-contrast) text-xs font-bold rounded-xl btn-interactive focus-ring shadow-sm flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{isGuest ? 'Sign In to Create Note' : 'Create New Note'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-(--bg-main) overflow-hidden" aria-label="Note Editor View">
      {/* Top Action Bar */}
      <div className="px-4 py-3 bg-(--bg-surface) border-b border-(--border-color) flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBackMobile}
            className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover) md:hidden btn-interactive focus-ring"
            aria-label="Back to note list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-(--bg-card) border border-(--border-color) rounded-xl">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 btn-interactive focus-ring ${
                mode === 'edit'
                  ? 'bg-(--primary) text-(--primary-contrast) shadow-xs'
                  : 'text-(--text-muted) hover:text-(--text-main)'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 btn-interactive focus-ring ${
                mode === 'preview'
                  ? 'bg-(--primary) text-(--primary-contrast) shadow-xs'
                  : 'text-(--text-muted) hover:text-(--text-main)'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Archive / Unarchive */}
          {note?.id && (
            <button
              onClick={() => {
                if (isGuest) {
                  onOpenAuth?.();
                  return;
                }
                onArchiveToggle(note.id, isArchived);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center space-x-1.5 btn-interactive focus-ring ${
                isArchived
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-(--bg-card) text-(--text-muted) border-(--border-color) hover:text-(--text-main) hover:bg-(--bg-surface-hover)'
              }`}
              title={isArchived ? 'Restore Note' : 'Archive Note'}
            >
              {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              <span className="hidden lg:inline">{isArchived ? 'Unarchive' : 'Archive'}</span>
            </button>
          )}

          {/* Delete Note */}
          {note?.id && (
            <button
              onClick={() => {
                if (isGuest) {
                  onOpenAuth?.();
                  return;
                }
                onDeleteNote(note.id);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 btn-interactive focus-ring flex items-center space-x-1.5"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden lg:inline">Delete</span>
            </button>
          )}

          {/* Save Note CTA (Tablet & Desktop) */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="hidden md:flex px-4 py-1.5 text-xs font-bold bg-(--primary) text-(--primary-contrast) rounded-xl hover:opacity-90 btn-interactive focus-ring shadow-sm items-center space-x-1.5 disabled:opacity-50"
            title="Save changes (Cmd+S)"
          >
            <Save className="w-4 h-4" />
            <span className='hidden lg:inline'>{saving ? 'Saving...' : 'Save Note'}</span>
          </button>
        </div>
      </div>

      {/* Validation Toast Feedback */}
      {saveSuccess && (
        <div className="mx-6 mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Main Content Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl w-full mx-auto">
        {/* Title Input */}
        <div className="space-y-1">
          <label htmlFor="note-title-input" className="sr-only">
            Note Title
          </label>
          <input
            ref={titleInputRef}
            id="note-title-input"
            type="text"
            placeholder="Note Title..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            aria-invalid={titleError ? 'true' : 'false'}
            aria-describedby={titleError ? 'title-error-msg' : undefined}
            className={`w-full text-2xl sm:text-3xl font-extrabold bg-transparent border-b pb-2 text-(--text-main) placeholder-(--text-muted)/50 focus-ring transition-colors ${
              titleError ? 'border-red-500 text-red-400' : 'border-(--border-color)'
            }`}
          />
          {titleError && (
            <p id="title-error-msg" className="text-xs font-medium text-red-500 flex items-center space-x-1 pt-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{titleError}</span>
            </p>
          )}
        </div>

        {/* Tag Editor Section */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-(--text-muted) uppercase tracking-wider">
            <TagIcon className="w-3.5 h-3.5 text-(--primary)" />
            <span>Tags</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-2 bg-(--bg-surface) border border-(--border-color) rounded-xl min-h-11">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-(--primary)/15 border border-(--primary)/30 text-xs font-bold text-(--primary)"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 btn-interactive focus-ring rounded"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center space-x-1 flex-1 min-w-35">
              <input
                type="text"
                placeholder="Add tag (Press Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="w-full text-xs bg-transparent text-(--text-main) placeholder-(--text-muted) focus:outline-none px-2 py-1"
              />
              {tagInput.trim() && (
                <button
                  onClick={handleAddTag}
                  className="p-1 text-(--primary) hover:bg-(--primary)/10 rounded btn-interactive focus-ring"
                  title="Add tag"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Section (Edit vs Preview) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-(--text-muted) pb-1">
            <span className="font-semibold uppercase tracking-wider">Content</span>
            <div className="flex items-center space-x-3">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{charCount} characters</span>
            </div>
          </div>

          {mode === 'edit' ? (
            <div>
              <textarea
                id="note-content-input"
                placeholder="Type your notes here... Supports Markdown formatting."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (contentError) setContentError(null);
                }}
                aria-invalid={contentError ? 'true' : 'false'}
                aria-describedby={contentError ? 'content-error-msg' : undefined}
                className={`w-full min-h-90 p-4 bg-(--bg-surface) border rounded-2xl text-sm leading-relaxed text-(--text-main) placeholder-(--text-muted)/50 focus-ring resize-y font-mono ${
                  contentError ? 'border-red-500' : 'border-(--border-color)'
                }`}
              />
              {contentError && (
                <p id="content-error-msg" className="text-xs font-medium text-red-500 flex items-center space-x-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{contentError}</span>
                </p>
              )}
            </div>
          ) : (
            <div className="w-full min-h-90 p-6 bg-(--bg-surface) border border-(--border-color) rounded-2xl text-sm leading-relaxed text-(--text-main) whitespace-pre-wrap font-sans">
              {content || <span className="text-(--text-muted) italic">No content written yet.</span>}
            </div>
          )}
        </div>

        {/* Bottom Save Note CTA (Mobile Only) */}
        <div className="pt-4 border-t border-(--border-color) md:hidden">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 px-4 bg-(--primary) text-(--primary-contrast) font-bold text-sm rounded-xl hover:opacity-90 btn-interactive focus-ring shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving Note...' : 'Save Note'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
