import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/usersApi';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import type { User, UserRole } from '@/types/auth';
import {
  Users as UsersIcon,
  PlusCircle,
  KeyRound,
  UserCheck,
  UserX,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RotateCcw
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [userToToggleStatus, setUserToToggleStatus] = useState<User | null>(null);

  // Create User form state
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('User');
  const [newTempPassword, setNewTempPassword] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Reset Password form state
  const [resetTempPassword, setResetTempPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Fetch users
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers()
  });

  // Password validation helper
  const checkPasswordStrength = (pwd: string) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /\d/.test(pwd) &&
      /[^a-zA-Z0-9]/.test(pwd)
    );
  };

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (dto: { username: string; temporaryPassword: string; role: UserRole }) =>
      usersApi.createUser(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateOpen(false);
      setNewUsername('');
      setNewTempPassword('');
      setNewRole('User');
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message || 'Kullanıcı oluşturulurken bir hata oluştu.');
    }
  });

  // Toggle status mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersApi.updateStatus(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToToggleStatus(null);
    }
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newTemporaryPassword }: { id: string; newTemporaryPassword: string }) =>
      usersApi.resetPassword(id, { newTemporaryPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setResetSuccess('Geçici şifre başarıyla atandı. Kullanıcının oturumları sonlandırıldı.');
      setTimeout(() => {
        setUserToResetPassword(null);
        setResetTempPassword('');
        setResetSuccess(null);
      }, 1500);
    },
    onError: (err: Error) => {
      setResetError(err.message || 'Şifre sıfırlanırken bir hata oluştu.');
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmedUsername = newUsername.trim();
    if (!trimmedUsername) {
      setCreateError('Lütfen kullanıcı adını giriniz.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setCreateError('Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }
    if (!checkPasswordStrength(newTempPassword)) {
      setCreateError('Geçici şifre en az 8 karakter olmalı; büyük/küçük harf, rakam ve özel karakter içermelidir.');
      return;
    }

    createMutation.mutate({
      username: trimmedUsername,
      role: newRole,
      temporaryPassword: newTempPassword
    });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!userToResetPassword) return;

    if (!checkPasswordStrength(resetTempPassword)) {
      setResetError('Yeni geçici şifre en az 8 karakter olmalı; büyük/küçük harf, rakam ve özel karakter içermelidir.');
      return;
    }

    resetPasswordMutation.mutate({
      id: userToResetPassword.id,
      newTemporaryPassword: resetTempPassword
    });
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === 'active' && u.isActive) ||
      (statusFilter === 'inactive' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kullanıcı Yönetimi</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Sistem kullanıcılarını yönetin, yeni hesap oluşturun, hesapları pasife alın veya şifrelerini sıfırlayın
          </p>
        </div>
        <Button
          onClick={() => {
            setNewUsername('');
            setNewTempPassword('');
            setNewRole('User');
            setCreateError(null);
            setIsCreateOpen(true);
          }}
          className="gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Yeni Kullanıcı Oluştur</span>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kullanıcı adına göre ara..."
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Roller</option>
            <option value="Admin">Yönetici (Admin)</option>
            <option value="User">Müşteri (User)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </select>

          {(searchTerm || roleFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('');
                setStatusFilter('');
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Filtreleri Temizle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <ErrorAlert
          message={(error as Error)?.message || 'Kullanıcılar yüklenirken bir hata oluştu.'}
          onDismiss={() => refetch()}
        />
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex justify-center items-center">
          <LoadingSpinner size="lg" message="Kullanıcı listesi yükleniyor..." />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Kullanıcı</th>
                <th className="px-4 py-3.5">Rol</th>
                <th className="px-4 py-3.5">Hesap Durumu</th>
                <th className="px-4 py-3.5">Şifre Durumu</th>
                <th className="px-4 py-3.5">Kayıt Tarihi</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 uppercase shrink-0">
                        {u.username.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">{u.username}</span>
                        <div className="text-xs text-slate-400 font-mono">#{u.id.substring(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge type="role" value={u.role} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" />
                        <span>Pasif</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {u.mustChangePassword ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 font-medium">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Geçici Şifre (Değişim Zorunlu)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-0.5 rounded-md border border-slate-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Kalıcı Şifre Aktif</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Password Reset */}
                      <button
                        onClick={() => {
                          setUserToResetPassword(u);
                          setResetTempPassword('');
                          setResetError(null);
                          setResetSuccess(null);
                        }}
                        className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                        title="Şifreyi Sıfırla"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      {/* Status Toggle Button */}
                      <button
                        onClick={() => setUserToToggleStatus(u)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          u.isActive
                            ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={u.isActive ? 'Hesabı Pasife Al' : 'Hesabı Aktifleştir'}
                      >
                        {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty state */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
            <UsersIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Kullanıcı Bulunamadı</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Arama veya filtreleme kriterlerine uygun kullanıcı bulunamadı.
          </p>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Yeni Kullanıcı Oluştur"
        description="Sisteme erişebilecek yeni bir kullanıcı tanımlayın ve ilk giriş için geçici şifre atayın."
      >
        <ErrorAlert message={createError} onDismiss={() => setCreateError(null)} className="mb-4" />

        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Kullanıcı Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Örn: ahmet.yilmaz"
              disabled={createMutation.isPending}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Rol
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              disabled={createMutation.isPending}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            >
              <option value="User">Müşteri (User) - Sadece kendi taleplerini görür</option>
              <option value="Admin">Yönetici (Admin) - Tüm sistem kontrolleri</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Geçici Şifre <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={newTempPassword}
                onChange={(e) => setNewTempPassword(e.target.value)}
                placeholder="Örn: GeciciSifre123!"
                disabled={createMutation.isPending}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              En az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir. Kullanıcı ilk girişinde bu şifreyi değiştirmek zorundadır.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createMutation.isPending}
            >
              Vazgeç
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Kullanıcıyı Kaydet
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!userToResetPassword}
        onClose={() => setUserToResetPassword(null)}
        title="Kullanıcı Şifresini Sıfırla"
        description={`"${userToResetPassword?.username}" kullanıcısı için yeni bir geçici şifre belirleyin.`}
      >
        <ErrorAlert message={resetError} onDismiss={() => setResetError(null)} className="mb-4" />

        {resetSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{resetSuccess}</span>
          </div>
        )}

        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 leading-relaxed">
            Geçici şifre atandığında kullanıcının tüm aktif oturumları güvenlik amacıyla kapatılacak ve ilk girişinde yeni şifre belirlemesi zorunlu kılınacaktır.
          </div>
        </div>

        <form onSubmit={handleResetSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Yeni Geçici Şifre <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={resetTempPassword}
                onChange={(e) => setResetTempPassword(e.target.value)}
                placeholder="Örn: YeniGecici123!"
                disabled={resetPasswordMutation.isPending || !!resetSuccess}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToResetPassword(null)}
              disabled={resetPasswordMutation.isPending || !!resetSuccess}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              isLoading={resetPasswordMutation.isPending}
              disabled={!!resetSuccess}
            >
              Şifreyi Sıfırla
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!userToToggleStatus}
        onClose={() => setUserToToggleStatus(null)}
        onConfirm={() => {
          if (userToToggleStatus) {
            statusMutation.mutate({
              id: userToToggleStatus.id,
              isActive: !userToToggleStatus.isActive
            });
          }
        }}
        isLoading={statusMutation.isPending}
        isDanger={userToToggleStatus?.isActive}
        title={userToToggleStatus?.isActive ? 'Hesabı Pasife Al' : 'Hesabı Aktifleştir'}
        message={
          userToToggleStatus?.isActive
            ? `"${userToToggleStatus.username}" kullanıcısının hesabını pasife almak istediğinizden emin misiniz? Kullanıcının tüm aktif oturumları anında sonlandırılacak ve sisteme tekrar giriş yapamayacaktır.`
            : `"${userToToggleStatus?.username}" kullanıcısının hesabını tekrar aktifleştirmek istediğinizden emin misiniz?`
        }
        confirmText={userToToggleStatus?.isActive ? 'Evet, Pasife Al' : 'Evet, Aktifleştir'}
      />
    </div>
  );
};
