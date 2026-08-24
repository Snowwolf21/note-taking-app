import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// We run this middleware only on note endpoints
export const config = {
  matcher: [
    '/api/notes',
    '/api/notes/:path*',
    '/api/v1/notes',
    '/api/v1/notes/:path*',
    '/api/v2/notes',
    '/api/v2/notes/:path*',
  ],
};

// Custom helper to compute HMAC SHA-256 signature in the Edge runtime
async function verifyHmacSignature(body: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Convert hex signature back to ArrayBuffer
    const sigBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      sigBytes,
      bodyData
    );
  } catch (error) {
    console.error('HMAC verification error in middleware:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const secret = process.env.API_SIGNING_SECRET;
  const path = request.nextUrl.pathname;
  
  // 1. Signature Validation (Mutating requests only: POST, PUT, PATCH, DELETE)
  const method = request.method;
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (mutatingMethods.includes(method)) {
    const hasSessionCookie = request.cookies.has('auth_token') || request.cookies.has('guest_token');
    
    // First-party browser sessions authenticated via cookies are trusted and bypass HMAC signature check
    if (!hasSessionCookie) {
      const signature = request.headers.get('x-signature');
      if (!signature) {
        return NextResponse.json({ error: 'Missing x-signature header' }, { status: 401 });
      }
      if (!secret) {
        return NextResponse.json({ error: 'Server signing key is not configured' }, { status: 500 });
      }

      // Read body text by cloning the request stream (keeps stream open for downstream handlers)
      const bodyText = await request.clone().text();
      const isValid = await verifyHmacSignature(bodyText, signature, secret);

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
      }
    }
  }

  // 2. Version Negotiation & Internal Path Rewrite (for legacy /api/notes only)
  if (path === '/api/notes' || path.startsWith('/api/notes/')) {
    let version = 'v1';
    const acceptHeader = request.headers.get('accept') || '';
    const acceptVersionHeader = request.headers.get('accept-version');

    if (acceptVersionHeader === '2' || acceptHeader.includes('version=2')) {
      version = 'v2';
    }

    const rewrittenUrl = new URL(request.nextUrl);
    rewrittenUrl.pathname = path.replace('/api/notes', `/api/${version}/notes`);

    const response = NextResponse.rewrite(rewrittenUrl);

    // 3. Inject Sunset & Deprecation Headers for legacy V1 APIs
    if (version === 'v1') {
      response.headers.set('Deprecation', 'true');
      response.headers.set('Sunset', 'Mon, 24 Aug 2026 18:00:00 GMT');
      response.headers.set('Warning', '299 - "API version v1 is deprecated and will be removed on 2026-08-24. Please upgrade to v2."');
    }

    return response;
  }

  return NextResponse.next();
}
