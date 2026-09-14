import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/api/ticketsApi';
import { categoriesApi } from '@/api/categoriesApi';
import { Button } from '@/components/common/Button';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import type { TicketPriority } from '@/types/ticket';
import { ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NewTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('Medium');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch active categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoriesApi.getCategories(true)
  });

  // Create ticket mutation
  const createMutation = useMutation({
    mutationFn: ticketsApi.createTicket,
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate(`/tickets/${newTicket.id}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();

    if (!trimmedTitle) {
      setValidationError('Lütfen talep başlığını giriniz.');
      return;
    }
    if (trimmedTitle.length < 5) {
      setValidationError('Talep başlığı en az 5 karakter uzunluğunda olmalıdır.');
      return;
    }
    if (trimmedTitle.length > 200) {
      setValidationError('Talep başlığı 200 karakterden uzun olamaz.');
      return;
    }
    if (!categoryId) {
      setValidationError('Lütfen talebinize uygun bir kategori seçiniz.');
      return;
    }
    if (!trimmedDesc) {
      setValidationError('Lütfen talebinizi açıklayan detaylı bir metin giriniz.');
      return;
    }
    if (trimmedDesc.length < 10) {
      setValidationError('Talep açıklaması en az 10 karakter uzunluğunda olmalıdır.');
      return;
    }

    createMutation.mutate({
      title: trimmedTitle,
      categoryId,
      priority,
      description: trimmedDesc
    });
  };

  const priorityOptions: { value: TicketPriority; label: string; desc: string; color: string }[] = [
    { value: 'Low', label: 'Düşük', desc: 'Genel sorular veya acil olmayan konular', color: 'border-slate-200 hover:border-slate-300' },
    { value: 'Medium', label: 'Orta', desc: 'Normal işleyişi aksatmayan problemler', color: 'border-sky-200 hover:border-sky-300' },
    { value: 'High', label: 'Yüksek', desc: 'İş akışını doğrudan etkileyen sorunlar', color: 'border-amber-200 hover:border-amber-300' },
    { value: 'Critical', label: 'Kritik', desc: 'Sistemi durduran acil arıza ve kesintiler', color: 'border-rose-200 hover:border-rose-300' }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/tickets"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Listeye Geri Dön"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Yeni Destek Talebi</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Karşılaştığınız teknik sorunu veya talebinizi detaylandırarak destek ekibimize iletin
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <ErrorAlert
          message={
            validationError ||
            (createMutation.isError ? (createMutation.error as Error).message : null)
          }
          onDismiss={() => setValidationError(null)}
          className="mb-6"
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Talep Başlığı <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">{title.length}/200</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="Örn: E-posta bildirimleri tarafıma ulaşmıyor"
              disabled={createMutation.isPending}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Kategori <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={createMutation.isPending || isLoadingCategories}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50"
            >
              <option value="">-- Kategori Seçiniz --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && !isLoadingCategories && (
              <p className="mt-1.5 text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Henüz aktif bir kategori bulunmuyor. Yöneticiyle iletişime geçiniz.</span>
              </p>
            )}
          </div>

          {/* Priority selector cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
              Öncelik Derecesi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {priorityOptions.map((opt) => {
                const isSelected = priority === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setPriority(opt.value)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : `${opt.color} bg-white`
                    }`}
                  >
                    <div className="pt-0.5">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Açıklama <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">{description.length}/4000</span>
            </div>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              placeholder="Sorunu veya talebinizi en ince ayrıntısına kadar açıklayınız..."
              disabled={createMutation.isPending}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-y"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link to="/tickets">
              <Button type="button" variant="outline" disabled={createMutation.isPending}>
                Vazgeç
              </Button>
            </Link>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
              className="gap-2"
              disabled={categories.length === 0}
            >
              <Send className="w-4 h-4" />
              <span>Talebi Oluştur</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
