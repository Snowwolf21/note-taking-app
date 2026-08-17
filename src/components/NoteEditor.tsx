'use client';

import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { NoteItem } from './NoteList';

interface NoteEditorProps {
  note: NoteItem | null;
  onSaveNote: (updated: { id?: string; title: string; content: string; tags: string[]; isArchived: boolean }) => Promise<void>;
  onArchiveToggle: (id: string, currentArchived: boolean) => Promise<void>;
  onDeleteNote: (id: string) => void;
  onBackMobile: () => void;
  isNewNoteMode?: boolean;
}

export function NoteEditor({
  note,
  onSaveNote,
  onArchiveToggle,
  onDeleteNote,
  onBackMobile,
  isNewNoteMode = false,
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
      setTimeout(() => setSaveSuccess(null), 2500);
    } catch (err: any) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!note && !isNewNoteMode) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-main)] text-[var(--text-muted)] space-y-3">
        <div className="p-4 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] shadow-sm">
          <Edit3 className="w-10 h-10 text-[var(--primary)] mx-auto opacity-50" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-main)]">No Note Selected</h3>
        <p className="text-sm max-w-sm">
          Select a note from the left directory list or click <strong className="text-[var(--primary)]">Create New Note</strong> to start editing.
        </p>
      </div>
    );
  }

  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] overflow-hidden" aria-label="Note Editor View">
      {/* Top Action Bar */}
      <div className="px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center space-x-2">
          <button
            onClick={onBackMobile}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] lg:hidden focus-ring"
            aria-label="Back to note list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl">
            <button
              onClick={() => setMode('edit')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors focus-ring ${
                mode === 'edit'
                  ? 'bg-[var(--primary)] text-[var(--primary-contrast)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors focus-ring ${
                mode === 'preview'
                  ? 'bg-[var(--primary)] text-[var(--primary-contrast)] shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
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
              onClick={() => onArchiveToggle(note.id, isArchived)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border flex items-center space-x-1.5 transition-colors focus-ring ${
                isArchived
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
              }`}
              title={isArchived ? 'Restore Note' : 'Archive Note'}
            >
              {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
              <span className="hidden sm:inline">{isArchived ? 'Unarchive' : 'Archive'}</span>
            </button>
          )}

          {/* Delete Note */}
          {note?.id && (
            <button
              onClick={() => onDeleteNote(note.id)}
              className="px-3 py-1.5 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-colors focus-ring flex items-center space-x-1.5"
              title="Delete Note"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          {/* Save Note CTA */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-bold bg-[var(--primary)] text-[var(--primary-contrast)] rounded-xl hover:opacity-90 transition-opacity focus-ring shadow-sm flex items-center space-x-1.5 disabled:opacity-50"
            title="Save changes (Cmd+S)"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Note'}</span>
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
            className={`w-full text-2xl sm:text-3xl font-extrabold bg-transparent border-b pb-2 text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus-ring transition-colors ${
              titleError ? 'border-red-500 text-red-400' : 'border-[var(--border-color)]'
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
          <div className="flex items-center space-x-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
            <TagIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>Tags</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 p-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl min-h-[44px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-[var(--primary)]/15 border border-[var(--primary)]/30 text-xs font-bold text-[var(--primary)]"
              >
                <span>#{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-red-400 focus-ring rounded"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            <div className="flex items-center space-x-1 flex-1 min-w-[140px]">
              <input
                type="text"
                placeholder="Add tag (Press Enter)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="w-full text-xs bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none px-2 py-1"
              />
              {tagInput.trim() && (
                <button
                  onClick={handleAddTag}
                  className="p-1 text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded focus-ring"
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
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-1">
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
                className={`w-full min-h-[360px] p-4 bg-[var(--bg-surface)] border rounded-2xl text-sm leading-relaxed text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus-ring resize-y font-mono ${
                  contentError ? 'border-red-500' : 'border-[var(--border-color)]'
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
            <div className="w-full min-h-[360px] p-6 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl text-sm leading-relaxed text-[var(--text-main)] whitespace-pre-wrap font-sans">
              {content || <span className="text-[var(--text-muted)] italic">No content written yet.</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
