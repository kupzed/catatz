import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockImplementation(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

import { updateSession } from '@/configs/supabase/middleware';

describe('Security Phase 3 - Session Revocation & Device Cookie Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(url: string, cookies: Record<string, string> = {}): NextRequest {
    const headers = new Headers();
    const cookieHeader = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
    if (cookieHeader) {
      headers.set('cookie', cookieHeader);
    }
    return new NextRequest(new URL(url, 'http://localhost:3000'), { headers });
  }

  it('redirects unauthenticated users on protected routes to /login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const req = createMockRequest('/transactions');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirects authenticated users without device_id cookie to /login?message=session-revoked (Option A: Strict)', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-789' } },
    });

    // Request has auth token cookie, but omits device_id cookie
    const req = createMockRequest('/transactions', {
      'sb-access-token': 'valid-jwt-token',
    });

    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?message=session-revoked');
    // Ensure auth token cookie is deleted on response
    expect(res.cookies.get('sb-access-token')?.value).toBe('');
  });

  it('redirects and clears cookies when device session is marked revoked in user_sessions', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-789' } },
    });

    const mockMaybeSingle = vi.fn().mockResolvedValueOnce({
      data: { revoked_at: '2026-10-27T08:00:00Z' },
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqDevice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqDevice });

    mockFrom.mockReturnValue({ select: mockSelect });

    const req = createMockRequest('/transactions', {
      'device_id': 'device-abc',
      'sb-access-token': 'valid-jwt-token',
    });

    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?message=session-revoked');
    expect(res.cookies.get('device_id')?.value).toBe('');
    expect(res.cookies.get('sb-access-token')?.value).toBe('');
  });

  it('allows authenticated users with active, unrevoked device_id to proceed', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-789' } },
    });

    const mockMaybeSingle = vi.fn().mockResolvedValueOnce({
      data: { revoked_at: null },
    });
    const mockLimit = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockEqUser = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqDevice = vi.fn().mockReturnValue({ eq: mockEqUser });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEqDevice });

    mockFrom.mockReturnValue({ select: mockSelect });

    const req = createMockRequest('/transactions', {
      'device_id': 'device-abc',
      'sb-access-token': 'valid-jwt-token',
    });

    const res = await updateSession(req);

    // Should proceed normally (no redirect to /login)
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users on auth pages (/login) to /', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: 'user-789' } },
    });

    const req = createMockRequest('/login', {
      'device_id': 'device-abc',
    });

    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/');
  });
});
