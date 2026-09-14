import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ArrowLeft, MessageSquare } from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Talep Detayı</h1>
          <p className="text-sm text-slate-500 font-mono text-xs mt-0.5">ID: {id}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
        <MessageSquare className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Talep Detay ve Yorumlaşma</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Detay ekranı ve yorum akışı Faz 18 kapsamında bağlanacaktır.
        </p>
        <Link to="/tickets">
          <Button variant="outline">Listeye Geri Dön</Button>
        </Link>
      </div>
    </div>
  );
};
