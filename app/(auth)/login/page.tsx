'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/db/dexie';
import { useUserStore } from '@/lib/stores/userStore';
import { pullUserDataFromSupabase } from '@/lib/sync/syncEngine';
import { showToast } from '@/components/ui/Toast';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useUserStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    setLoading(true);

    try {
      // Try Dexie first for offline login
      const db = getDB();

      if (!isOnline) {
        // Offline: try cached user
        const cachedUser = await db.users.where('email').equals(data.email.toLowerCase()).first();
        if (cachedUser) {
          setUser(cachedUser);
          router.replace('/dashboard');
          return;
        } else {
          setError('No cached credentials found. Please connect to internet to sign in for the first time.');
          return;
        }
      }

      // Online sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Sign in failed');
        return;
      }

      // Pull user data
      showToast(t('syncingData'), 'info');
      await pullUserDataFromSupabase(authData.user.id);

      // Load user from Dexie
      const localUser = await db.users.get(authData.user.id);
      if (localUser) {
        setUser(localUser);

        // Determine redirect
        if (!localUser.has_client_profile && !localUser.has_provider_profile) {
          router.replace('/objective');
        } else {
          router.replace('/dashboard');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(t('errorOccurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full px-6 py-8">
      <Link href="/landing" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 w-fit">
        <ArrowLeft size={16} />
        <span className="text-sm">{t('back')}</span>
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t('welcomeBack')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('binder')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Input
          label={t('email')}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label={t('password')}
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <Button type="submit" fullWidth size="lg" loading={loading} className="mt-6">
          {t('signInBtn')}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('dontHaveAccount')}{' '}
        <Link href="/signup" className="font-semibold text-blue-800 hover:text-blue-900">
          {t('signUp')}
        </Link>
      </p>
    </div>
  );
}
