import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '@/api/ticketsApi';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import type { TicketStatus } from '@/types/ticket';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User as UserIcon,
  Tag,
  Trash2,
  Send,
  Lock,
  MessageSquare,
  ChevronDown
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isDeleteTicketOpen, setIsDeleteTicketOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);

  // Fetch ticket details
  const {
    data: ticket,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicketById(id!),
    enabled: !!id
  });

  // Update Status mutation (Admin only)
  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: TicketStatus) =>
      ticketsApi.updateStatus(id!, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    }
  });

  // Delete ticket mutation (Admin only)
  const deleteTicketMutation = useMutation({
    mutationFn: () => ticketsApi.deleteTicket(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      navigate('/tickets');
    }
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: (content: string) =>
      ticketsApi.createComment(id!, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setCommentContent('');
      setCommentError(null);
    },
    onError: (err: Error) => {
      setCommentError(err.message || 'Yorum eklenirken bir hata oluştu.');
    }
  });

  // Delete comment mutation (Admin only)
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      ticketsApi.deleteComment(id!, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      setCommentToDelete(null);
    }
  });

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);

    const trimmed = commentContent.trim();
    if (!trimmed) {
      setCommentError('Lütfen bir yorum metni giriniz.');
      return;
    }

    createCommentMutation.mutate(trimmed);
  };

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

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-16 flex justify-center items-center">
        <LoadingSpinner size="lg" message="Talep detayları yükleniyor..." />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-4">
        <Link to="/tickets" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" />
          <span>Taleplere Dön</span>
        </Link>
        <ErrorAlert
          message={(error as Error)?.message || 'Destek talebi bulunamadı veya erişim yetkiniz yok.'}
          onDismiss={() => refetch()}
        />
      </div>
    );
  }

  const isClosed = ticket.status === 'Closed';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/tickets"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="Listeye Geri Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                #{ticket.id.substring(0, 8)}
              </span>
              <Badge type="status" value={ticket.status} />
              <Badge type="priority" value={ticket.priority} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* Admin Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {isAdmin && (
            <>
              {/* Status change select */}
              <div className="relative">
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value as TicketStatus)}
                  disabled={updateStatusMutation.isPending}
                  className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="Open">Durum: Açık</option>
                  <option value="InProgress">Durum: İşlemde</option>
                  <option value="Resolved">Durum: Çözüldü</option>
                  <option value="Closed">Durum: Kapatıldı</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Delete ticket button */}
              <button
                onClick={() => setIsDeleteTicketOpen(true)}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                title="Talebi Sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ticket Details & Metadata Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Meta tags bar */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pb-6 border-b border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-slate-400" />
            <span>Oluşturan:</span>
            <span className="font-semibold text-slate-900">{ticket.createdByUsername}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-slate-400" />
            <span>Kategori:</span>
            <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {ticket.categoryName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Oluşturulma:</span>
            <span className="text-slate-700">{formatDate(ticket.createdAt)}</span>
          </div>

          {ticket.updatedAt && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Son Güncelleme:</span>
              <span className="text-slate-700">{formatDate(ticket.updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Description Body */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Talep Açıklaması
          </h3>
          <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-normal">
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Yorumlar ve Yazışmalar
            </h2>
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {ticket.comments.length}
            </span>
          </div>
        </div>

        {/* Comments Stream */}
        <div className="space-y-4">
          {ticket.comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Bu talep için henüz bir yorum yazılmadı. İlk yorumu aşağıdan ekleyebilirsiniz.
            </p>
          ) : (
            ticket.comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                      {comment.username.charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{comment.username}</span>
                    <Badge type="role" value={comment.userRole} />
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatDate(comment.createdAt)}</span>
                    {isAdmin && (
                      <button
                        onClick={() => setCommentToDelete(comment.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Yorumu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line pl-9">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Box */}
        <div className="pt-6 border-t border-slate-100">
          {isClosed ? (
            <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-3 text-slate-600 text-sm">
              <Lock className="w-5 h-5 text-slate-500 shrink-0" />
              <span>Bu destek talebi kapatılmıştır. Kapatılmış taleplere yeni yorum eklenemez.</span>
            </div>
          ) : (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <ErrorAlert
                message={commentError}
                onDismiss={() => setCommentError(null)}
                className="mb-2"
              />

              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Yeni Yorum Ekle
              </label>

              <textarea
                rows={3}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Yanıtınızı veya ilave bilgileri buraya yazınız..."
                disabled={createCommentMutation.isPending}
                className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 resize-y"
              />

              <div className="flex justify-end">
                <Button
                  type="submit"
                  isLoading={createCommentMutation.isPending}
                  className="gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Yorum Gönder</span>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Delete Ticket Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteTicketOpen}
        onClose={() => setIsDeleteTicketOpen(false)}
        onConfirm={() => deleteTicketMutation.mutate()}
        isLoading={deleteTicketMutation.isPending}
        title="Talebi Sil"
        message={`"${ticket.title}" başlıklı destek talebini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Talebi Sil"
      />

      {/* Delete Comment Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!commentToDelete}
        onClose={() => setCommentToDelete(null)}
        onConfirm={() => {
          if (commentToDelete) deleteCommentMutation.mutate(commentToDelete);
        }}
        isLoading={deleteCommentMutation.isPending}
        title="Yorumu Sil"
        message="Bu yorumu kalıcı olarak silmek istediğinizden emin misiniz?"
        confirmText="Evet, Yorumu Sil"
      />
    </div>
  );
};
