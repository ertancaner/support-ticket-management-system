import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/api/categoriesApi';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import type { Category } from '@/types/category';
import {
  FolderKanban,
  PlusCircle,
  Edit2,
  Trash2,
  Ticket,
  Calendar,
  CheckCircle2,
  XCircle,
  Tag
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State for modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all categories (active + inactive for Admin)
  const {
    data: categories = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['categories', 'all'],
    queryFn: () => categoriesApi.getCategories(false)
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (categoryName: string) => categoriesApi.createCategory({ name: categoryName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreateOpen(false);
      setName('');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Kategori oluşturulurken bir hata oluştu.');
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, categoryName, active }: { id: string; categoryName: string; active: boolean }) =>
      categoriesApi.updateCategory(id, { name: categoryName, isActive: active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToEdit(null);
      setName('');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Kategori güncellenirken bir hata oluştu.');
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryToDelete(null);
    }
  });

  const handleOpenCreate = () => {
    setName('');
    setIsActive(true);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setName(cat.name);
    setIsActive(cat.isActive);
    setFormError(null);
    setCategoryToEdit(cat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Lütfen kategori adını giriniz.');
      return;
    }
    if (trimmed.length < 2) {
      setFormError('Kategori adı en az 2 karakter olmalıdır.');
      return;
    }
    if (trimmed.length > 100) {
      setFormError('Kategori adı 100 karakterden uzun olamaz.');
      return;
    }

    if (categoryToEdit) {
      updateMutation.mutate({
        id: categoryToEdit.id,
        categoryName: trimmed,
        active: isActive
      });
    } else {
      createMutation.mutate(trimmed);
    }
  };

  const formatDate = (dateString: string) => {
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kategori Yönetimi</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Destek talepleri için kategorileri oluşturun, düzenleyin ve aktiflik durumlarını yönetin
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="gap-2 self-start sm:self-auto">
          <PlusCircle className="w-4 h-4" />
          <span>Yeni Kategori Ekle</span>
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <ErrorAlert
          message={(error as Error)?.message || 'Kategoriler yüklenirken bir hata oluştu.'}
          onDismiss={() => refetch()}
        />
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 flex justify-center items-center">
          <LoadingSpinner size="lg" message="Kategoriler yükleniyor..." />
        </div>
      ) : categories.length > 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Kategori Adı</th>
                <th className="px-4 py-3.5">Durum</th>
                <th className="px-4 py-3.5 text-center">Bilet Sayısı</th>
                <th className="px-4 py-3.5">Oluşturulma Tarihi</th>
                <th className="px-6 py-3.5 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-900">{cat.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {cat.isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Aktif</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3 h-3" />
                        <span>Pasif</span>
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                      <Ticket className="w-3 h-3 text-slate-500" />
                      {cat.ticketCount}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDate(cat.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(cat)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Kategoriyi Düzenle"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(cat)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Kategoriyi Sil"
                      >
                        <Trash2 className="w-4 h-4" />
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
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Kategori Bulunamadı</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Henüz sisteme tanımlanmış bir destek kategorisi bulunmuyor. Yeni bir kategori ekleyerek başlayabilirsiniz.
          </p>
          <Button onClick={handleOpenCreate}>Yeni Kategori Ekle</Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!categoryToEdit}
        onClose={() => {
          setIsCreateOpen(false);
          setCategoryToEdit(null);
        }}
        title={categoryToEdit ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
        description={
          categoryToEdit
            ? 'Kategori adını veya aktiflik durumunu güncelleyiniz.'
            : 'Destek taleplerinin atanabileceği yeni bir kategori oluşturun.'
        }
      >
        <ErrorAlert message={formError} onDismiss={() => setFormError(null)} className="mb-4" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Kategori Adı <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Ağ ve Bağlantı Sorunları"
              maxLength={100}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Active status checkbox (when editing) */}
          {categoryToEdit && (
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={updateMutation.isPending}
                  className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-700">Kategori Aktif</span>
              </label>
              <p className="text-xs text-slate-500 mt-1 pl-6.5">
                Pasif kategoriler kullanıcıların yeni talep oluşturma ekranında listelenmez.
              </p>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setCategoryToEdit(null);
              }}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {categoryToEdit ? 'Değişiklikleri Kaydet' : 'Kategori Oluştur'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={() => {
          if (categoryToDelete) deleteMutation.mutate(categoryToDelete.id);
        }}
        isLoading={deleteMutation.isPending}
        title="Kategoriyi Sil"
        message={`"${categoryToDelete?.name}" kategorisini silmek istediğinizden emin misiniz? Kategori arşivlenecektir.`}
        confirmText="Evet, Sil"
      />
    </div>
  );
};
