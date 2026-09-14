import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { usersApi } from '@/api/usersApi';
import { useAuth } from '@/context/AuthContext';
import { Lock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isForced?: boolean;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  isForced = false,
  onSuccess
}) => {
  const { refreshAuth } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const handleClose = () => {
    if (isForced) return;
    resetForm();
    if (onClose) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Form validations
    if (!currentPassword.trim()) {
      setError('Lütfen mevcut şifrenizi giriniz.');
      return;
    }
    if (!newPassword.trim()) {
      setError('Lütfen yeni şifrenizi giriniz.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Yeni şifre en az 6 karakter uzunluğunda olmalıdır.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Yeni şifreniz mevcut şifreniz ile aynı olamaz.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifre ve şifre tekrarı birbiriyle eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);

    try {
      await usersApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      });

      // Refresh session cookies and user state
      await refreshAuth();

      setSuccess('Şifreniz başarıyla değiştirildi.');
      setTimeout(() => {
        resetForm();
        if (onSuccess) onSuccess();
        if (!isForced && onClose) onClose();
      }, 1200);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Şifre değiştirme işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isClosable={!isForced}
      title={isForced ? 'İlk Giriş: Şifre Değiştirme Zorunlu' : 'Şifre Değiştir'}
      description={
        isForced
          ? 'Güvenliğiniz için sisteme devam etmeden önce geçici şifrenizi yeni bir şifreyle değiştirmelisiniz.'
          : 'Hesap güvenliğiniz için şifrenizi dilediğiniz zaman güncelleyebilirsiniz.'
      }
    >
      {isForced && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            Yönetici tarafından atanan geçici şifrenizle giriş yaptınız. Uygulamayı kullanabilmek için en az 6 karakterden oluşan yeni ve güvenli bir şifre belirleyiniz.
          </div>
        </div>
      )}

      <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />

      {success && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {isForced ? 'Geçici / Mevcut Şifre' : 'Mevcut Şifre'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting || !!success}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Yeni Şifre
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="En az 6 karakter"
              disabled={isSubmitting || !!success}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Yeni Şifre (Tekrar)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni şifrenizi tekrar girin"
              disabled={isSubmitting || !!success}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          {!isForced && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting || !!success}
            >
              Vazgeç
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={!!success}
            className={isForced ? 'w-full' : ''}
          >
            Şifreyi Güncelle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
