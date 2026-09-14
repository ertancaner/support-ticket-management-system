import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { ArrowLeft, PlusCircle } from 'lucide-react';

export const NewTicketPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/tickets" className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Yeni Destek Talebi</h1>
          <p className="text-sm text-slate-600 mt-0.5">Karşılaştığınız sorunu veya ihtiyacınızı detaylandırın</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
        <PlusCircle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Yeni Talep Formu</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-4">
          Bilet oluşturma formu Faz 18 kapsamında kategori seçimi ve validasyon kurallarıyla aktif edilecektir.
        </p>
        <Link to="/tickets">
          <Button variant="outline">Listeye Geri Dön</Button>
        </Link>
      </div>
    </div>
  );
};
