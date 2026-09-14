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

  // Real-time password strength requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
  const isStrongPassword = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

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
    if (!isStrongPassword) {
      setError('Yeni şifre en az 8 karakter uzunluğunda olmalı ve büyük harf, küçük harf, rakam ve özel karakter içermelidir.');
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
      title={isForced ? 'İlk Giriş: Güçlü Şifre Belirleme Zorunlu' : 'Şifre Değiştir'}
      description={
        isForced
          ? 'Güvenliğiniz için sisteme devam etmeden önce geçici şifrenizi güçlü bir yeni şifreyle değiştirmelisiniz.'
          : 'Hesap güvenliğiniz için şifrenizi dilediğiniz zaman güncelleyebilirsiniz.'
      }
    >
      {isForced && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            Yönetici tarafından atanan geçici şifrenizle giriş yaptınız. Uygulamayı kullanabilmek için güvenlik kriterlerine uygun güçlü bir şifre belirleyiniz.
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
              placeholder="Güçlü şifrenizi girin"
              disabled={isSubmitting || !!success}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Real-time password strength checklist */}
          <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="font-semibold text-slate-700 mb-1">Şifre Güvenlik Kriterleri:</div>
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
              <span>En az 8 karakter</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUpperCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasUpperCase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
              <span>En az bir büyük harf (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowerCase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasLowerCase ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
              <span>En az bir küçük harf (a-z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
              <span>En az bir rakam (0-9)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasSpecialChar ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 ml-1 mr-1 shrink-0" />}
              <span>En az bir özel karakter (!@#$%^&* vb.)</span>
            </div>
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
            disabled={!isStrongPassword || !!success}
            className={isForced ? 'w-full' : ''}
          >
            Şifreyi Güncelle
          </Button>
        </div>
      </form>
    </Modal>
  );
};
