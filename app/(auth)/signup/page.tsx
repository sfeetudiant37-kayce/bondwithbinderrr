'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowLeft, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/db/dexie';
import { useUserStore } from '@/lib/stores/userStore';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v === true, 'You must agree to the Terms and Conditions'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useUserStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { agreeTerms: false },
  });

  const onSubmit = async (data: FormData) => {
    setError('');

    if (!isOnline) {
      setError(t('internetRequired'));
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (!authData.user) {
        setError('Registration failed. Please try again.');
        return;
      }

      const userId = authData.user.id;
      const now = new Date().toISOString();

      const newUser = {
        id: userId,
        email: data.email.toLowerCase(),
        name: data.name.trim(),
        phone: data.phone.trim(),
        language: 'en' as const,
        has_client_profile: false,
        has_provider_profile: false,
        active_role: 'client' as const,
        avatar_color: 'blue' as const,
        is_dummy: false,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      };

      // Save to Supabase
      const { error: insertError } = await supabase.from('users').insert(newUser);
      if (insertError) {
        console.error('Error inserting user:', insertError);
      }

      // Save to Dexie
      const db = getDB();
      await db.users.put(newUser);

      setUser(newUser);
      router.replace('/objective');
    } catch (err) {
      console.error('Signup error:', err);
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
        <h1 className="text-2xl font-bold text-slate-900">{t('createAccount')}</h1>
        <p className="text-slate-500 mt-1 text-sm">{t('binder')}</p>
      </div>

      {!isOnline && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <WifiOff size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{t('internetRequired')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Input
          label={t('fullName')}
          type="text"
          placeholder="Jean Dupont"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label={t('email')}
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label={t('phone')}
          type="tel"
          placeholder="+237 6XX XXX XXX"
          error={errors.phone?.message}
          {...register('phone')}
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
            className="absolute right-3 top-8 text-slate-400"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="relative">
          <Input
            label={t('confirmPassword')}
            type={showConfirm ? 'text' : 'password'}
            placeholder="••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-8 text-slate-400"
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex items-start gap-2 mt-2">
          <input
            type="checkbox"
            id="agreeTerms"
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-800 cursor-pointer"
            {...register('agreeTerms')}
          />
          <label htmlFor="agreeTerms" className="text-sm text-slate-600 cursor-pointer">
            {t('agreeTerms')}
          </label>
        </div>
        {errors.agreeTerms && (
          <p className="text-xs text-red-600 -mt-2">{errors.agreeTerms.message}</p>
        )}

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={loading}
          disabled={!isOnline}
          className="mt-2"
        >
          {t('createAccountBtn')}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        {t('alreadyHaveAccount')}{' '}
        <Link href="/login" className="font-semibold text-blue-800 hover:text-blue-900">
          {t('signIn')}
        </Link>
      </p>
    </div>
  );
}
