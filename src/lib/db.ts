import fs from 'fs';
import path from 'path';

// Fallback File-based Database implementation for robust offline execution
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const NOTES_FILE = path.join(DATA_DIR, 'notes.json');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
  if (!fs.existsSync(NOTES_FILE)) fs.writeFileSync(NOTES_FILE, JSON.stringify([]));
  if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, JSON.stringify([]));
}

function readJSON<T>(file: string): T[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJSON<T>(file: string, data: T[]) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// Resilient DB Adapter exposing Prisma-like API
export const db = {
  user: {
    findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
      const users = readJSON<any>(USERS_FILE);
      if (where.id) return users.find((u: any) => u.id === where.id) || null;
      if (where.email) return users.find((u: any) => u.email === where.email) || null;
      return null;
    },
    create: async ({ data }: { data: any }) => {
      const users = readJSON<any>(USERS_FILE);
      const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name || null,
        fontTheme: data.fontTheme || 'sans',
        colorTheme: data.colorTheme || 'dark',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      users.push(newUser);
      writeJSON(USERS_FILE, users);
      return newUser;
    },
    update: async ({ where, data }: { where: { id?: string; email?: string }; data: any }) => {
      const users = readJSON<any>(USERS_FILE);
      const index = users.findIndex((u: any) => (where.id ? u.id === where.id : u.email === where.email));
      if (index === -1) throw new Error('User not found');

      users[index] = {
        ...users[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeJSON(USERS_FILE, users);
      return users[index];
    },
  },

  note: {
    count: async ({ where }: { where?: any } = {}) => {
      const notes = readJSON<any>(NOTES_FILE);
      if (!where) return notes.length;
      return notes.filter((n: any) => (where.userId === null ? n.userId === null : n.userId === where.userId)).length;
    },
    findMany: async ({ where, orderBy }: { where?: any; orderBy?: any } = {}) => {
      let notes = readJSON<any>(NOTES_FILE);
      if (where) {
        if ('userId' in where) {
          notes = notes.filter((n: any) => n.userId === where.userId);
        }
        if ('isArchived' in where) {
          notes = notes.filter((n: any) => Boolean(n.isArchived) === Boolean(where.isArchived));
        }
      }
      if (orderBy?.updatedAt === 'desc') {
        notes.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      }
      return notes;
    },
    findUnique: async ({ where }: { where: { id: string } }) => {
      const notes = readJSON<any>(NOTES_FILE);
      return notes.find((n: any) => n.id === where.id) || null;
    },
    create: async ({ data }: { data: any }) => {
      const notes = readJSON<any>(NOTES_FILE);
      const newNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: data.userId || null,
        title: data.title,
        content: data.content,
        tags: data.tags || '[]',
        isArchived: Boolean(data.isArchived),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      notes.unshift(newNote);
      writeJSON(NOTES_FILE, notes);
      return newNote;
    },
    update: async ({ where, data }: { where: { id: string }; data: any }) => {
      const notes = readJSON<any>(NOTES_FILE);
      const index = notes.findIndex((n: any) => n.id === where.id);
      if (index === -1) throw new Error('Note not found');

      notes[index] = {
        ...notes[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      writeJSON(NOTES_FILE, notes);
      return notes[index];
    },
    delete: async ({ where }: { where: { id: string } }) => {
      let notes = readJSON<any>(NOTES_FILE);
      notes = notes.filter((n: any) => n.id !== where.id);
      writeJSON(NOTES_FILE, notes);
      return { success: true };
    },
  },

  passwordResetToken: {
    create: async ({ data }: { data: any }) => {
      const tokens = readJSON<any>(TOKENS_FILE);
      const newToken = {
        id: `token_${Date.now()}`,
        email: data.email,
        token: data.token,
        expiresAt: data.expiresAt.toISOString(),
        createdAt: new Date().toISOString(),
        userId: data.userId || null,
      };
      tokens.push(newToken);
      writeJSON(TOKENS_FILE, tokens);
      return newToken;
    },
    findFirst: async ({ where }: { where: any }) => {
      const tokens = readJSON<any>(TOKENS_FILE);
      const now = new Date();
      return (
        tokens.find(
          (t: any) =>
            t.email === where.email &&
            t.token === where.token &&
            new Date(t.expiresAt).getTime() > now.getTime()
        ) || null
      );
    },
    delete: async ({ where }: { where: { id: string } }) => {
      let tokens = readJSON<any>(TOKENS_FILE);
      tokens = tokens.filter((t: any) => t.id !== where.id);
      writeJSON(TOKENS_FILE, tokens);
      return { success: true };
    },
  },
};
