'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Trash2, RefreshCw, Globe, ChevronRight, Plus, User, Shield, Info } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { useUserStore } from '@/lib/stores/userStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useSyncStore } from '@/lib/stores/syncStore';
import { supabase } from '@/lib/supabase/client';
import { getDB } from '@/lib/db/dexie';
import { processQueue } from '@/lib/sync/syncEngine';
import { showToast } from '@/components/ui/Toast';
import type { Language } from '@/types';

export default function SettingsPage() {
  const { user, clearUser } = useUserStore();
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const { pendingCount, isOnline, isSyncing, setSyncing } = useSyncStore();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    router.replace('/landing');
  };

  const handleSync = async () => {
    if (!user || !isOnline) return;
    await processQueue(user.id);
    showToast(t('allSynced'), 'success');
  };

  const handleDeleteAccount = async () => {
    if (!user || !deletePassword) return;
    setDeleting(true);
    try {
      // Verify password
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });
      if (error) {
        showToast('Invalid password', 'error');
        setDeleting(false);
        return;
      }

      const db = getDB();
      const now = new Date().toISOString();
      await db.users.update(user.id, { is_deleted: true, updated_at: now });
      await supabase.from('users').update({ is_deleted: true, updated_at: now }).eq('id', user.id);
      await supabase.auth.signOut();
      clearUser();
      showToast(t('accountDeleted'), 'info');
      router.replace('/landing');
    } catch (err) {
      showToast(t('errorOccurred'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'fr' : 'en';
    setLanguage(newLang);
    if (user) {
      supabase.from('users').update({ language: newLang }).eq('id', user.id);
    }
  };

  if (!user) return null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-900">{t('settings')}</h1>

      {/* Language */}
      <Card>
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-between py-1"
        >
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{t('languageSettings')}</span>
          </div>
          <span className="text-sm font-semibold text-blue-800 border border-blue-200 rounded-lg px-3 py-1">
            {language === 'en' ? 'EN' : 'FR'}
          </span>
        </button>
      </Card>

      {/* Sync Status */}
      <Card>
        <button
          onClick={() => router.push('/sync')}
          className="w-full flex items-center justify-between py-1"
        >
          <div className="flex items-center gap-3">
            <RefreshCw size={18} className={`${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <div>
              <span className="text-sm font-medium text-slate-700">{t('syncStatus')}</span>
              {pendingCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  {pendingCount} pending
                </span>
              )}
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </button>
        {pendingCount > 0 && isOnline && (
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={handleSync}
            loading={isSyncing}
            className="mt-3"
          >
            {t('syncNow')}
          </Button>
        )}
      </Card>

      {/* Account */}
      <Card>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('account')}</h3>
        <div className="space-y-0 divide-y divide-slate-50">
          {!user.has_client_profile && (
            <button
              onClick={() => {
                sessionStorage.setItem('onboarding_role', 'client');
                router.push('/objective');
              }}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Plus size={16} className="text-blue-700" />
                <span className="text-sm text-blue-700">{t('addClientProfile')}</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          )}
          {!user.has_provider_profile && (
            <button
              onClick={() => {
                sessionStorage.setItem('onboarding_role', 'provider');
                router.push('/objective');
              }}
              className="w-full flex items-center justify-between py-3 text-left"
            >
              <div className="flex items-center gap-3">
                <Plus size={16} className="text-blue-700" />
                <span className="text-sm text-blue-700">{t('addProviderProfile')}</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          )}
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <User size={16} className="text-slate-500" />
              <span className="text-sm text-slate-700">{t('editProfile')}</span>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </button>
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="w-full flex items-center justify-between py-3 text-left"
          >
            <div className="flex items-center gap-3">
              <Trash2 size={16} className="text-red-500" />
              <span className="text-sm text-red-600">{t('deleteAccount')}</span>
            </div>
          </button>
        </div>
      </Card>

      {/* About */}
      <Card>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t('about')}</h3>
        <div className="space-y-0 divide-y divide-slate-50">
          {[
            { label: t('aboutBinder'), icon: Info },
            { label: t('termsConditions'), icon: Shield },
            { label: t('privacyPolicy'), icon: Shield },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Icon size={16} className="text-slate-500" />
                <span className="text-sm text-slate-700">{label}</span>
              </div>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3 text-center">{t('allRightsReserved')}</p>
      </Card>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 text-red-600 font-medium text-sm hover:bg-red-50 rounded-xl transition-colors"
      >
        <LogOut size={16} />
        {t('logOut')}
      </button>

      {/* Delete Account Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title={t('deleteAccount')}
        description={t('confirmDeleteAccount')}
        confirmLabel={t('deleteAccountConfirm')}
        cancelLabel={t('cancel')}
        onConfirm={handleDeleteAccount}
        onCancel={() => { setDeleteConfirmOpen(false); setDeletePassword(''); }}
      >
        <Input
          type="password"
          label={t('enterPassword')}
          placeholder="••••••"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
        />
      </ConfirmDialog>
    </div>
  );
}
