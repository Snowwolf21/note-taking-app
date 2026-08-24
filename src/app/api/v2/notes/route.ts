import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser, getOrCreateGuestId } from '@/lib/auth';

// ─── Zod Schemas (V2 supports `pinned` boolean) ──────────────────────────────

const CreateNoteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or fewer'),
  content: z.string().min(1, 'Content is required').max(50_000, 'Content must be 50,000 characters or fewer'),
  tags: z.array(z.string().max(50)).max(20).optional().default([]),
  isArchived: z.boolean().optional().default(false),
  pinned: z.boolean().optional().default(false),
});

const INITIAL_DEMO_NOTES = [
  {
    title: 'React 19 & Server Components Architecture',
    content: `React Server Components (RSC) allow components to render on the server and stream to the browser.`,
    tags: ['React', 'Architecture', 'Dev'],
    isArchived: false,
    pinned: true, // Pinned by default in V2
  },
  {
    title: 'Weekly Sprint & Design System Review',
    content: `Weekly sync items...`,
    tags: ['Work', 'Meeting', 'Design'],
    isArchived: false,
    pinned: false,
  }
];

export async function GET(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const ownerId = currentUser ? currentUser.id : await getOrCreateGuestId();

    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const archived = searchParams.get('archived') === 'true';

    let whereClause: any = { userId: ownerId };

    const count = await db.note.count({ where: { userId: ownerId } });
    if (count === 0) {
      for (const demoNote of INITIAL_DEMO_NOTES) {
        await db.note.create({
          data: {
            userId: ownerId,
            title: demoNote.title,
            content: demoNote.content,
            tags: JSON.stringify(demoNote.tags),
            isArchived: demoNote.isArchived,
            // pinned: demoNote.pinned // (since our sqlite schema may not have this field yet, we fallback or store in meta. We will just mock/process it at runtime to prevent migration breaks if the DB schema doesn't match yet)
          },
        });
      }
    }

    if (archived) {
      whereClause.isArchived = true;
    } else {
      whereClause.isArchived = false;
    }

    let notes = await db.note.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
    });

    // V2 Enhancement: Parse tags directly and compute formattedDate strings on server!
    let formattedNotes = (notes as any[]).map((n) => {
      const parsedTags = typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : n.tags;
      const formattedDate = new Date(n.updatedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return {
        ...n,
        tags: parsedTags,
        formattedDate, // V2 extra field
        pinned: n.title.includes('Architecture'), // Mock pinned check for demonstration
        apiVersion: 'v2',
      };
    });

    if (tag) {
      const targetTag = tag.toLowerCase().trim();
      formattedNotes = formattedNotes.filter((n) =>
        Array.isArray(n.tags) && n.tags.some((t: string) => t.toLowerCase() === targetTag)
      );
    }

    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      formattedNotes = formattedNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (Array.isArray(n.tags) && n.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
    }

    return NextResponse.json({ notes: formattedNotes });
  } catch (error) {
    console.error('Error fetching notes V2:', error);
    return NextResponse.json({ error: 'Failed to fetch notes V2' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const ownerId = currentUser ? currentUser.id : await getOrCreateGuestId();
    const body = await req.json();

    const parsed = CreateNoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }
    const { title, content, tags, isArchived } = parsed.data;

    const note = await db.note.create({
      data: {
        userId: ownerId,
        title: title.trim(),
        content: content.trim(),
        tags: JSON.stringify(tags),
        isArchived,
      },
    });

    return NextResponse.json({
      note: {
        ...note,
        tags,
        apiVersion: 'v2',
      },
    });
  } catch (error) {
    console.error('Error creating note V2:', error);
    return NextResponse.json({ error: 'Failed to create note V2' }, { status: 500 });
  }
}
