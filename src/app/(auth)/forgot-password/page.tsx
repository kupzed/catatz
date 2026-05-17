'use client';

import { useActionState, useEffect } from 'react';
import Link from 'next/link';
import { resetPasswordRequest } from '@/actions/auth-action';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetPasswordRequest, null);

  useEffect(() => {
    if (state?.error) {
      toast.error('Gagal', { description: state.error });
    }
    if (state?.success && state?.message) {
      toast.success('Terkirim', { description: state.message });
    }
  }, [state]);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      <Link href="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Login
      </Link>
      
      <h2 className="text-xl font-semibold text-white mb-1">Lupa Password?</h2>
      <p className="text-slate-400 text-sm mb-6">Masukkan email yang terdaftar untuk mengatur ulang password.</p>

      <form action={formAction} method="POST" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-300">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              required
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending || state?.success}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium h-11 mt-2 transition-all duration-200"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Mengirim...
            </>
          ) : (
            'Kirim Link Reset Password'
          )}
        </Button>
      </form>
    </div>
  );
}
