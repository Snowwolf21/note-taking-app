import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import type { NoteItem } from '@/components/NoteList';

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchNotes(
  activeView: 'all' | 'archived',
  activeTag: string | null,
  searchQuery: string,
): Promise<NoteItem[]> {
  const params = new URLSearchParams();
  if (activeView === 'archived') params.set('archived', 'true');
  if (activeTag) params.set('tag', activeTag);
  if (searchQuery) params.set('search', searchQuery);

  const res = await fetch(`/api/notes?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch notes');
  const data = await res.json();
  return data.notes as NoteItem[];
}

type SaveNotePayload = {
  id?: string;
  title: string;
  content: string;
  tags: string[];
  isArchived: boolean;
};

async function saveNote(payload: SaveNotePayload): Promise<NoteItem> {
  const url = payload.id ? `/api/notes/${payload.id}` : '/api/notes';
  const method = payload.id ? 'PUT' : 'POST';

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to save note');
  const data = await res.json();
  return data.note as NoteItem;
}

async function archiveNote(id: string, isArchived: boolean): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isArchived }),
  });
  if (!res.ok) throw new Error('Failed to archive note');
}

async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete note');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotes() {
  const queryClient = useQueryClient();

  const activeView = useAppStore((s) => s.activeView);
  const activeTag = useAppStore((s) => s.activeTag);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectedNoteId = useAppStore((s) => s.selectedNoteId);
  const setSelectedNoteId = useAppStore((s) => s.setSelectedNoteId);

  const queryKey = ['notes', activeView, activeTag, searchQuery] as const;

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const { data: notes = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchNotes(activeView, activeTag, searchQuery),
  });

  // Clear selectedNoteId only if the selected note was deleted (no longer in the list).
  // Never auto-select a note — the user must click to open one.
  useEffect(() => {
    if (selectedNoteId !== null) {
      const exists = notes.some((n) => n.id === selectedNoteId);
      if (!exists) {
        setSelectedNoteId(null);
      }
    }
  }, [notes, selectedNoteId, setSelectedNoteId]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notes'] });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const { mutateAsync: saveNoteMutation } = useMutation({
    mutationFn: saveNote,
    onSuccess: (savedNote) => {
      setSelectedNoteId(savedNote.id);
      invalidate();
    },
  });

  const { mutateAsync: archiveToggle } = useMutation({
    mutationFn: ({ id, isArchived }: { id: string; isArchived: boolean }) =>
      archiveNote(id, isArchived),
    onSuccess: invalidate,
  });

  const { mutateAsync: removeNote } = useMutation({
    mutationFn: deleteNote,
    onSuccess: invalidate,
  });

  return {
    notes,
    isLoading,
    saveNote: saveNoteMutation,
    archiveToggle,
    deleteNote: removeNote,
  };
}
