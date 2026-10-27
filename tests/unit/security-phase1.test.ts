import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetUser = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/configs/supabase/server', () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: mockGetUser,
      signInWithPassword: mockSignInWithPassword,
      updateUser: mockUpdateUser,
    },
  })),
}));

const mockParseVoiceTranscript = vi.fn();
vi.mock('@/lib/voice-parser', () => ({
  parseVoiceTranscript: (...args: unknown[]) => mockParseVoiceTranscript(...args),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { processVoiceInput } from '@/actions/voice-action';
import { changePassword } from '@/actions/profile-action';

describe('Security Phase 1 - Server Action Guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processVoiceInput', () => {
    it('blocks unauthenticated callers without invoking Gemini AI parser', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
      });

      const result = await processVoiceInput('beli kopi 20000');

      expect(result).toEqual({
        success: false,
        error: 'Silakan login terlebih dahulu untuk menggunakan fitur suara.',
      });
      expect(mockParseVoiceTranscript).not.toHaveBeenCalled();
    });

    it('allows authenticated callers to proceed to parseVoiceTranscript', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
      });
      mockParseVoiceTranscript.mockResolvedValueOnce({
        transactions: [{ tipe: 'expense', nominal: 20000, catatan: 'kopi' }],
        parse_summary: 'Berhasil mencatat pengeluaran kopi Rp 20.000',
      });

      const result = await processVoiceInput('beli kopi 20000');

      expect(result.success).toBe(true);
      expect(mockParseVoiceTranscript).toHaveBeenCalledWith('beli kopi 20000');
    });
  });

  describe('changePassword', () => {
    it('blocks unauthenticated callers', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
      });

      const result = await changePassword({
        currentPassword: 'oldPassword123!',
        newPassword: 'newPassword123!',
      });

      expect(result).toEqual({
        success: false,
        error: 'Tidak terautentikasi',
      });
    });

    it('rejects empty or omitted currentPassword', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });

      // Type cast to test runtime defense against malformed client payloads
      const result = await changePassword({
        currentPassword: '',
        newPassword: 'newPassword123!',
      });

      expect(result).toEqual({
        success: false,
        error: 'Password lama wajib diisi',
      });
      expect(mockSignInWithPassword).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('rejects incorrect currentPassword', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSignInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid credentials' },
      });

      const result = await changePassword({
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123!',
      });

      expect(result).toEqual({
        success: false,
        error: 'Password lama tidak sesuai',
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('updates password only after current password verification succeeds', async () => {
      mockGetUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123', email: 'test@example.com' } },
      });
      mockSignInWithPassword.mockResolvedValueOnce({
        error: null,
      });
      mockUpdateUser.mockResolvedValueOnce({
        error: null,
      });

      const result = await changePassword({
        currentPassword: 'validOldPassword123!',
        newPassword: 'newPassword123!',
      });

      expect(result).toEqual({
        success: true,
        message: 'Password berhasil diperbarui',
      });
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validOldPassword123!',
      });
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: 'newPassword123!',
      });
    });
  });
});
