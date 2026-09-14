import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { usersApi } from '@/api/usersApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  Lock,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  KeyRound,
  Check,
  X
} from 'lucide-react';

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
  const { showSuccess } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real-time password strength requirements
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);
  
  const passedCriteriaCount = [
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  const isStrongPassword = passedCriteriaCount === 5;

  // Password strength meter calculation
  const getStrengthMeta = () => {
    if (!newPassword) return { label: 'Girilmedi', color: 'bg-slate-200', text: 'text-slate-400', percent: 0 };
    if (passedCriteriaCount <= 2) return { label: 'Zayıf', color: 'bg-rose-500', text: 'text-rose-600', percent: 25 };
    if (passedCriteriaCount === 3) return { label: 'Orta', color: 'bg-amber-500', text: 'text-amber-600', percent: 50 };
    if (passedCriteriaCount === 4) return { label: 'İyi', color: 'bg-blue-500', text: 'text-blue-600', percent: 75 };
    return { label: 'Güçlü ve Güvenli', color: 'bg-emerald-500', text: 'text-emerald-600', percent: 100 };
  };

  const strength = getStrengthMeta();

  // Confirm password matching state
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const resetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
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
      setError('Lütfen geçici / mevcut şifrenizi giriniz.');
      return;
    }
    if (!newPassword.trim()) {
      setError('Lütfen yeni şifrenizi belirleyiniz.');
      return;
    }
    if (!isStrongPassword) {
      setError('Yeni şifreniz tüm güvenlik kriterlerini karşılamalıdır.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Yeni şifreniz, mevcut geçici şifreniz ile aynı olamaz.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Yeni şifre ile şifre tekrarı birbiriyle uyuşmuyor.');
      return;
    }

    setIsSubmitting(true);

    try {
      await usersApi.changePassword({
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim()
      });

      // Show top-of-page success toast notification
      showSuccess('Şifreniz başarıyla kaydedildi.');

      // Refresh session cookies and user state
      await refreshAuth();

      resetForm();
      if (onSuccess) onSuccess();
      if (!isForced && onClose) onClose();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj.message || 'Şifre güncelleme işlemi başarısız oldu. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isClosable={!isForced}
      maxWidth="md"
      title={isForced ? 'Hesap Güvenliği: Yeni Şifre Belirleme' : 'Şifre Güncelleme'}
      description={
        isForced
          ? 'Hesabınızı etkinleştirmek için lütfen geçici şifrenizi kalıcı bir parola ile güncelleyin.'
          : 'Hesap güvenliğinizi korumak için şifrenizi dilediğiniz zaman güncelleyebilirsiniz.'
      }
    >
      {/* Enterprise Security Notice Banner */}
      {isForced && (
        <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  Zorunlu Güvenlik Adımı
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-200/80 text-blue-800 rounded-full">
                  İlk Kurulum
                </span>
              </div>
              <p className="text-xs text-blue-800/90 leading-relaxed">
                Yönetici tarafından atanan geçici şifrenizle oturum açtınız. Kurumsal veri güvenliği politikası gereği, panele devam etmeden önce kişisel ve güçlü bir şifre tanımlamalısınız.
              </p>
            </div>
          </div>
        </div>
      )}

      <ErrorAlert message={error} onDismiss={() => setError(null)} className="mb-4" />

      {success && (
        <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-sm font-medium text-emerald-900 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current / Temporary Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {isForced ? 'Geçici Şifre' : 'Mevcut Şifre'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting || !!success}
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showCurrentPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Yeni Kalıcı Şifre
            </label>
            {newPassword && (
              <span className={`text-xs font-medium ${strength.text}`}>
                {strength.label}
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni güçlü parolanızı girin"
              disabled={isSubmitting || !!success}
              className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Progress Bar */}
          {newPassword && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-out ${strength.color}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* Password Criteria Checklist */}
          <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 pb-1 border-b border-slate-200/60">
              <span>Şifre Güvenlik Kriterleri</span>
              <span className="text-[11px] font-normal text-slate-500">
                {passedCriteriaCount} / 5 sağlandı
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {hasMinLength ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span>En az 8 karakter</span>
              </div>

              <div className={`flex items-center gap-2 ${hasUpperCase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {hasUpperCase ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span>Büyük harf (A-Z)</span>
              </div>

              <div className={`flex items-center gap-2 ${hasLowerCase ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {hasLowerCase ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span>Küçük harf (a-z)</span>
              </div>

              <div className={`flex items-center gap-2 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {hasNumber ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span>Rakam (0-9)</span>
              </div>

              <div className={`flex items-center gap-2 sm:col-span-2 ${hasSpecialChar ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                {hasSpecialChar ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  </div>
                )}
                <span>Özel karakter (! @ # $ % ^ & * vb.)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Yeni Şifre Doğrulama
            </label>
            {passwordsMatch && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <Check className="w-3.5 h-3.5" />
                Şifreler eşleşiyor
              </span>
            )}
            {passwordsMismatch && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium">
                <X className="w-3.5 h-3.5" />
                Şifreler eşleşmiyor
              </span>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Yeni parolanızı tekrar girin"
              disabled={isSubmitting || !!success}
              className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 disabled:bg-slate-50 transition-shadow ${
                passwordsMismatch
                  ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/30'
                  : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
              tabIndex={-1}
              aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-end gap-3">
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
            disabled={!isStrongPassword || !passwordsMatch || !!success}
            className={`gap-2 ${isForced ? 'w-full py-2.5 text-base font-semibold shadow-md shadow-blue-500/10' : ''}`}
          >
            {isForced ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Şifreyi Kaydet ve Giriş Yap</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            ) : (
              <span>Şifreyi Güncelle</span>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

