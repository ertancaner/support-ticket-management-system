import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/api/ticketsApi';
import { categoriesApi } from '@/api/categoriesApi';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Pagination } from '@/components/common/Pagination';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import type { TicketListItem, TicketPriority, TicketStatus } from '@/types/ticket';
import {
  PlusCircle,
  Search,
  RotateCcw,
  MessageSquare,
  Eye,
  Trash2,
  Ticket as TicketIcon,
  Clock,
  User as UserIcon,
  Tag
} from 'lucide-react';

export const TicketsListPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<TicketStatus | ''>('');
  const [priority, setPriority] = useState<TicketPriority | ''>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('CreatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Deletion modal state
  const [ticketToDelete, setTicketToDelete] = useState<TicketListItem | null>(null);

  // Fetch active categories for dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['categories', 'active'],
    queryFn: () => categoriesApi.getCategories(true)
  });

  // Fetch tickets with TanStack Query
  const queryParams = {
    search: search.trim() || undefined,
    status: (status as TicketStatus) || undefined,
    priority: (priority as TicketPriority) || undefined,
    categoryId: categoryId || undefined,
    sortBy,
    sortOrder,
    pageNumber,
    pageSize
  };

  const {
    data: pagedData,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['tickets', queryParams],
    queryFn: () => ticketsApi.getTickets(queryParams)
  });

  // Delete ticket mutation (Admin only)
  const deleteMutation = useMutation({
    mutationFn: (id: string) => ticketsApi.deleteTicket(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      setTicketToDelete(null);
    }
  });

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setPriority('');
    setCategoryId('');
    setSortBy('CreatedAt');
    setSortOrder('desc');
    setPageNumber(1);
  };

  const hasActiveFilters = !!search || !!status || !!priority || !!categoryId;

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Destek Talepleri</h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Tüm destek taleplerinizi filtreleyin, durumlarını izleyin ve yönetin
          </p>
        </div>
        {!isAdmin && (
          <Link to="/tickets/new">
            <Button className="gap-2 w-full sm:w-auto">
              <PlusCircle className="w-4 h-4" />
              <span>Yeni Talep Oluştur</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search query */}
          <div className="relative lg:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPageNumber(1);
              }}
              placeholder="Başlık veya içerikte ara..."
              className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPageNumber(1);
              }}
              className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TicketStatus | '');
                setPageNumber(1);
              }}
              className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="Open">Açık</option>
              <option value="InProgress">İşlemde</option>
              <option value="Resolved">Çözüldü</option>
              <option value="Closed">Kapatıldı</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TicketPriority | '');
                setPageNumber(1);
              }}
              className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tüm Öncelikler</option>
              <option value="Low">Düşük</option>
              <option value="Medium">Orta</option>
              <option value="High">Yüksek</option>
              <option value="Critical">Kritik</option>
            </select>
          </div>
        </div>

        {/* Secondary row: Sorting & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sırala:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
                setPageNumber(1);
              }}
              className="py-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="CreatedAt-desc">En Yeni Eklenen</option>
              <option value="CreatedAt-asc">En Eski Eklenen</option>
              <option value="Title-asc">Başlık (A-Z)</option>
              <option value="Title-desc">Başlık (Z-A)</option>
              <option value="Priority-desc">Öncelik (Yüksekten Düşüğe)</option>
              <option value="Priority-asc">Öncelik (Düşükten Yükseğe)</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Filtreleri Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <ErrorAlert
          message={(error as Error)?.message || 'Talepler yüklenirken bir hata oluştu.'}
          onDismiss={() => refetch()}
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex justify-center items-center">
          <LoadingSpinner size="lg" message="Destek talepleri yükleniyor..." />
        </div>
      ) : pagedData && pagedData.items.length > 0 ? (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">Talep Başlığı</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5">Öncelik</th>
                  <th className="px-4 py-3.5">Durum</th>
                  <th className="px-4 py-3.5">Oluşturan</th>
                  <th className="px-4 py-3.5">Tarih</th>
                  <th className="px-4 py-3.5 text-center">Yorum</th>
                  <th className="px-6 py-3.5 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedData.items.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                      >
                        {ticket.title}
                      </Link>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">
                        #{ticket.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {ticket.categoryName}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge type="priority" value={ticket.priority} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge type="status" value={ticket.status} />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{ticket.createdByUsername}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(ticket.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        <MessageSquare className="w-3 h-3 text-slate-500" />
                        {ticket.commentCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Detayı Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => setTicketToDelete(ticket)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Talebi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {pagedData.items.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 text-sm line-clamp-2"
                    >
                      {ticket.title}
                    </Link>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      #{ticket.id.substring(0, 8)}
                    </div>
                  </div>
                  <Badge type="status" value={ticket.status} />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <Badge type="priority" value={ticket.priority} />
                  <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    {ticket.categoryName}
                  </span>
                  <span className="text-slate-500 inline-flex items-center gap-1 ml-auto">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {ticket.commentCount}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>{ticket.createdByUsername} • {formatDate(ticket.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    <Link to={`/tickets/${ticket.id}`} className="text-blue-600 font-medium">
                      Detay
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => setTicketToDelete(ticket)}
                        className="text-rose-600 font-medium cursor-pointer"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            pageNumber={pagedData.pageNumber}
            pageSize={pagedData.pageSize}
            totalPages={pagedData.totalPages}
            totalRecords={pagedData.totalRecords}
            onPageChange={(page) => setPageNumber(page)}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageNumber(1);
            }}
          />
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
            <TicketIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">Destek Talebi Bulunamadı</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {hasActiveFilters
              ? 'Seçilen filtre kriterlerine uygun destek talebi bulunamadı. Filtreleri sıfırlamayı deneyebilirsiniz.'
              : isAdmin
                ? 'Henüz sisteme eklenmiş bir destek talebi bulunmamaktadır.'
                : 'Henüz oluşturduğunuz bir destek talebi bulunmamaktadır.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={handleResetFilters}>
              Filtreleri Temizle
            </Button>
          ) : !isAdmin ? (
            <Link to="/tickets/new">
              <Button>Yeni Talep Oluştur</Button>
            </Link>
          ) : null}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!ticketToDelete}
        onClose={() => setTicketToDelete(null)}
        onConfirm={() => {
          if (ticketToDelete) deleteMutation.mutate(ticketToDelete.id);
        }}
        isLoading={deleteMutation.isPending}
        title="Talebi Sil"
        message={`"${ticketToDelete?.title}" başlıklı destek talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
      />
    </div>
  );
};
