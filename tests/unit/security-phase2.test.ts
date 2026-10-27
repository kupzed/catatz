import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockStorageUpload = vi.fn();
const mockStorageGetPublicUrl = vi.fn();
const mockFromUpdate = vi.fn();
const mockFromEq = vi.fn();

vi.mock('@/configs/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockStorageUpload,
        getPublicUrl: mockStorageGetPublicUrl,
      }),
    },
    from: vi.fn().mockReturnValue({
      update: mockFromUpdate.mockReturnValue({
        eq: mockFromEq,
      }),
    }),
  })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { safeNextPath } from '@/lib/auth-callback';
import { uploadAvatar } from '@/actions/profile-action';

describe('Security Phase 2 - Input Validation and XSS Prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('safeNextPath (Open Redirect Prevention)', () => {
    it('defaults to /transactions for null, empty, or non-string inputs', () => {
      expect(safeNextPath(null)).toBe('/transactions');
      expect(safeNextPath('')).toBe('/transactions');
      // @ts-expect-error testing invalid type payload
      expect(safeNextPath(undefined)).toBe('/transactions');
      // @ts-expect-error testing invalid type payload
      expect(safeNextPath(123)).toBe('/transactions');
    });

    it('blocks protocol-relative URLs (//evil.com)', () => {
      expect(safeNextPath('//evil.com')).toBe('/transactions');
      expect(safeNextPath('///evil.com')).toBe('/transactions');
    });

    it('blocks absolute external URLs (https://evil.com)', () => {
      expect(safeNextPath('https://evil.com')).toBe('/transactions');
      expect(safeNextPath('http://evil.com')).toBe('/transactions');
      expect(safeNextPath('javascript:alert(1)')).toBe('/transactions');
    });

    it('blocks slash-backslash variations that normalize to external origins in WHATWG URL', () => {
      expect(safeNextPath('/\\evil.com')).toBe('/transactions');
      expect(safeNextPath('/\\\\evil.com')).toBe('/transactions');
      expect(safeNextPath('/foo\\bar')).toBe('/transactions');
    });

    it('blocks URL-encoded backslash and slash sequences', () => {
      expect(safeNextPath('/%5cevil.com')).toBe('/transactions');
      expect(safeNextPath('/%5Cevil.com')).toBe('/transactions');
      expect(safeNextPath('/%5C%5Cevil.com')).toBe('/transactions');
    });

    it('allows valid internal application paths with queries', () => {
      expect(safeNextPath('/transactions')).toBe('/transactions');
      expect(safeNextPath('/transactions?tab=realtime')).toBe('/transactions?tab=realtime');
      expect(safeNextPath('/settings')).toBe('/settings');
      expect(safeNextPath('/wallets')).toBe('/wallets');
      expect(safeNextPath('/reports?from=2026-01-01&to=2026-01-31')).toBe(
        '/reports?from=2026-01-01&to=2026-01-31',
      );
    });
  });

  describe('uploadAvatar (Stored XSS Prevention)', () => {
    it('blocks unauthenticated upload attempts', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const formData = new FormData();
      formData.append(
        'avatar',
        new File(['dummy'], 'avatar.jpg', { type: 'image/jpeg' }),
      );

      const result = await uploadAvatar(formData);
      expect(result).toEqual({ success: false, error: 'Tidak terautentikasi' });
      expect(mockStorageUpload).not.toHaveBeenCalled();
    });

    it('rejects SVG uploads (preventing stored XSS in storage bucket)', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
      });

      const svgPayload = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
      const formData = new FormData();
      formData.append(
        'avatar',
        new File([svgPayload], 'avatar.svg', { type: 'image/svg+xml' }),
      );

      const result = await uploadAvatar(formData);
      expect(result).toEqual({
        success: false,
        error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.',
      });
      expect(mockStorageUpload).not.toHaveBeenCalled();
    });

    it('rejects unsupported image types such as GIF or TIFF', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
      });

      const formData = new FormData();
      formData.append(
        'avatar',
        new File(['gif data'], 'avatar.gif', { type: 'image/gif' }),
      );

      const result = await uploadAvatar(formData);
      expect(result).toEqual({
        success: false,
        error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.',
      });
      expect(mockStorageUpload).not.toHaveBeenCalled();
    });

    it('rejects files larger than 2MB', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
      });

      // 2MB + 1 byte
      const largeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'avatar.jpg', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('avatar', largeFile);

      const result = await uploadAvatar(formData);
      expect(result).toEqual({
        success: false,
        error: 'Ukuran file terlalu besar (maksimal 2MB)',
      });
      expect(mockStorageUpload).not.toHaveBeenCalled();
    });

    it('uploads valid JPEG file and forces canonical .jpg extension regardless of original name', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
      });
      mockStorageUpload.mockResolvedValueOnce({ error: null });
      mockStorageGetPublicUrl.mockReturnValueOnce({
        data: { publicUrl: 'https://catatz.supabase.co/storage/v1/object/public/avatars/user-456/avatar.jpg' },
      });
      mockFromEq.mockResolvedValueOnce({ error: null });

      const file = new File(['valid jpg content'], 'arbitrary_name.custom_ext', {
        type: 'image/jpeg',
      });
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(formData);
      expect(result.success).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalledWith(
        'user-456/avatar.jpg',
        file,
        expect.objectContaining({
          upsert: true,
          contentType: 'image/jpeg',
        }),
      );
    });

    it('uploads valid WebP file with canonical .webp extension', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-456' } },
      });
      mockStorageUpload.mockResolvedValueOnce({ error: null });
      mockStorageGetPublicUrl.mockReturnValueOnce({
        data: { publicUrl: 'https://catatz.supabase.co/storage/v1/object/public/avatars/user-456/avatar.webp' },
      });
      mockFromEq.mockResolvedValueOnce({ error: null });

      const file = new File(['valid webp content'], 'profile.webp', {
        type: 'image/webp',
      });
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(formData);
      expect(result.success).toBe(true);
      expect(mockStorageUpload).toHaveBeenCalledWith(
        'user-456/avatar.webp',
        file,
        expect.objectContaining({
          upsert: true,
          contentType: 'image/webp',
        }),
      );
    });
  });
});
