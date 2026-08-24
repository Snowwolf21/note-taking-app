import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser, getOrCreateGuestId } from '@/lib/auth';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const UpdateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  content: z.string().min(1, 'Content is required').max(50_000, 'Content must be 50,000 characters or fewer'),
  tags: z.array(z.string().max(50)).max(20).default([]),
  isArchived: z.boolean().optional(),
});

const ArchiveNoteSchema = z.object({
  isArchived: z.boolean({ message: 'isArchived must be a boolean' }),
});


export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const expectedId = currentUser ? currentUser.id : await getOrCreateGuestId();

    const note = await db.note.findUnique({
      where: { id },
    });

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.userId !== expectedId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      note: {
        ...note,
        tags: typeof note.tags === 'string' ? JSON.parse(note.tags || '[]') : note.tags,
      },
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const expectedId = currentUser ? currentUser.id : await getOrCreateGuestId();
    const body = await req.json();
    const parsed = UpdateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { title, content, tags, isArchived } = parsed.data;

    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existing.userId !== expectedId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedNote = await db.note.update({
      where: { id },
      data: {
        title: title.trim(),
        content: content.trim(),
        tags: JSON.stringify(tags),
        ...(isArchived !== undefined ? { isArchived } : {}),
      },
    });

    return NextResponse.json({
      note: {
        ...updatedNote,
        tags,
      },
    });
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const expectedId = currentUser ? currentUser.id : await getOrCreateGuestId();
    const body = await req.json();

    const parsed = ArchiveNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { isArchived } = parsed.data;

    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existing.userId !== expectedId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await db.note.update({
      where: { id },
      data: { isArchived: Boolean(isArchived) },
    });

    return NextResponse.json({
      note: {
        ...updated,
        tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags || '[]') : updated.tags,
      },
    });
  } catch (error) {
    console.error('Error toggling archive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentUser = await getCurrentUser();
    const expectedId = currentUser ? currentUser.id : await getOrCreateGuestId();

    const existing = await db.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (existing.userId !== expectedId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db.note.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
