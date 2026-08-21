import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, getOrCreateGuestId } from '@/lib/auth';

const INITIAL_DEMO_NOTES = [
  {
    title: 'React 19 & Server Components Architecture',
    content: `React Server Components (RSC) allow components to render on the server and stream to the browser.

### Key Benefits:
- **Zero Bundle Size**: Server components do not ship JS code to client browsers.
- **Direct Database Access**: Fetch data right inside async server components.
- **Automatic Code Splitting**: Client components imported inside server components are split into small lazy chunks.

\`\`\`tsx
export async function NotesList() {
  const notes = await db.note.findMany();
  return <ul role="list">{notes.map(n => <li key={n.id}>{n.title}</li>)}</ul>;
}
\`\`\``,
    tags: ['React', 'Architecture', 'Dev'],
    isArchived: false,
  },
  {
    title: 'Weekly Sprint & Design System Review',
    content: `### Agenda Items for Monday Sync:
1. Review Figma design mockups & typography scale.
2. Confirm keyboard shortcuts (\`Cmd+N\` for New Note, \`Cmd+S\` for Save).
3. Test screen reader accessibility for form validation alerts.
4. Verify database persistence with SQLite & Prisma.

**Action Items:**
- [x] Create Figma color tokens
- [x] Implement theme switcher (Light, Dark, Sepia, Slate)
- [ ] Conduct lighthouse accessibility audit`,
    tags: ['Work', 'Meeting', 'Design'],
    isArchived: false,
  },
  {
    title: 'Idea: AI Voice-to-Text Memos',
    content: `Brainstorming session for voice note integration:
- Record short 30-second audio clips using the browser MediaRecorder API.
- Send payload to Gemini API for instant transcription and automatic tag generation.
- Save summary directly into Inkwell notes workspace!`,
    tags: ['Ideas', 'Personal', 'AI'],
    isArchived: false,
  },
  {
    title: 'Frontend Mentor Challenge Checklist',
    content: `Comprehensive checklist for the note-taking web app challenge:

* [x] Create, read, update, and delete notes
* [x] Archive notes
* [x] View all notes & view archived notes
* [x] View notes with specific tags
* [x] Search notes by title, tag, and content
* [x] Select color theme (Light, Dark, Sepia, Slate)
* [x] Select font theme (Sans-serif, Serif, Monospace)
* [x] Form validation error states & messages
* [x] 100% Keyboard navigation & focus rings
* [x] Responsive layout (Mobile, Tablet, Desktop)
* [x] Save details to SQLite database
* [x] User authentication (Register, Login, Password Reset)`,
    tags: ['Dev', 'A11y', 'Checklist'],
    isArchived: true,
  },
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

    // Check count for user/guest session, seed if 0 notes exist
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

    let formattedNotes = notes.map((n) => ({
      ...n,
      tags: typeof n.tags === 'string' ? JSON.parse(n.tags || '[]') : n.tags,
    }));

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
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    const ownerId = currentUser ? currentUser.id : await getOrCreateGuestId();
    const body = await req.json();
    const { title, content, tags, isArchived } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const parsedTags = Array.isArray(tags) ? tags : [];

    const note = await db.note.create({
      data: {
        userId: ownerId,
        title: title.trim(),
        content: content.trim(),
        tags: JSON.stringify(parsedTags),
        isArchived: Boolean(isArchived),
      },
    });

    return NextResponse.json({
      note: {
        ...note,
        tags: parsedTags,
      },
    });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
