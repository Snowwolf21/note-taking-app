import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomInt } from 'crypto';
import { db } from '@/lib/db';
import {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  getCurrentUser,
} from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  name: z.string().max(100).optional(),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email format').max(254),
  password: z.string().min(1, 'Password is required').max(128),
});

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format').max(254),
});

const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format').max(254),
  code: z.string().length(6, 'Reset code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(128),
});

const UpdateSettingsSchema = z.object({
  colorTheme: z.string().max(20).optional(),
  fontTheme: z.string().max(20).optional(),
});


export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user }, { status: 200 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // Rate-limit sensitive auth actions: max 10 requests per minute per IP
    const sensitiveActions = ['login', 'register', 'forgot-password', 'reset-password'];
    if (sensitiveActions.includes(action)) {
      const ip = getClientIp(req);
      const allowed = checkRateLimit(`${ip}:${action}`, { limit: 10, windowMs: 60_000 });
      if (!allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }

    // 1. REGISTER
    if (action === 'register') {
      const parsed = RegisterSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { email, password, name } = parsed.data;

      const existingUser = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'An account with this email already exists.' },
          { status: 400 }
        );
      }

      const passwordHash = await hashPassword(password);
      const user = await db.user.create({
        data: {
          email: email.toLowerCase().trim(),
          passwordHash,
          name: name?.trim() || null,
        },
      });

      const token = await signToken({ userId: user.id, email: user.email });
      await setAuthCookie(token);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          fontTheme: user.fontTheme,
          colorTheme: user.colorTheme,
        },
      });
    }

    // 2. LOGIN
    if (action === 'login') {
      const parsed = LoginSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { email, password } = parsed.data;

      const user = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Invalid email or password.' },
          { status: 401 }
        );
      }

      const token = await signToken({ userId: user.id, email: user.email });
      await setAuthCookie(token);

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          fontTheme: user.fontTheme,
          colorTheme: user.colorTheme,
        },
      });
    }

    // 3. LOGOUT
    if (action === 'logout') {
      await clearAuthCookie();
      return NextResponse.json({ success: true });
    }

    // 4. CHANGE PASSWORD
    if (action === 'change-password') {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const parsed = ChangePasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { currentPassword, newPassword } = parsed.data;

      const user = await db.user.findUnique({ where: { id: currentUser.id } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const isMatch = await verifyPassword(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { error: 'Current password is incorrect.' },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(newPassword);
      await db.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ message: 'Password updated successfully!' });
    }

    // 5. FORGOT PASSWORD (Generate Reset Token)
    if (action === 'forgot-password') {
      const parsed = ForgotPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { email } = parsed.data;

      const user = await db.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user) {
        // Return generic message to prevent account enumeration
        return NextResponse.json({
          message: 'If an account exists with this email, a reset code was generated.',
        });
      }

      const token = randomInt(100000, 999999).toString(); // Cryptographically secure 6-digit PIN code
      const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

      await db.passwordResetToken.create({
        data: {
          email: user.email,
          token,
          expiresAt,
          userId: user.id,
        },
      });

      return NextResponse.json({
        message: 'If an account exists with this email, a reset code has been sent.',
      });
    }

    // 6. RESET PASSWORD (Validate Code & Update Password)
    if (action === 'reset-password') {
      const parsed = ResetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
      }
      const { email, code, newPassword } = parsed.data;

      const resetRecord = await db.passwordResetToken.findFirst({
        where: {
          email: email.toLowerCase().trim(),
          token: code.trim(),
          expiresAt: { gt: new Date() },
        },
      });

      if (!resetRecord) {
        return NextResponse.json(
          { error: 'Invalid or expired password reset code.' },
          { status: 400 }
        );
      }

      const newHash = await hashPassword(newPassword);
      await db.user.update({
        where: { email: email.toLowerCase().trim() },
        data: { passwordHash: newHash },
      });

      // Cleanup token
      await db.passwordResetToken.delete({ where: { id: resetRecord.id } });

      return NextResponse.json({
        message: 'Password reset successfully! You can now log in.',
      });
    }

    // 7. UPDATE THEME SETTINGS
    if (action === 'update-settings') {
      const currentUser = await getCurrentUser();
      const parsed = UpdateSettingsSchema.safeParse(body);
      const { colorTheme, fontTheme } = parsed.success ? parsed.data : body;

      if (currentUser) {
        await db.user.update({
          where: { id: currentUser.id },
          data: {
            colorTheme: colorTheme || currentUser.colorTheme,
            fontTheme: fontTheme || currentUser.fontTheme,
          },
        });
      }

      return NextResponse.json({ success: true, colorTheme, fontTheme });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
