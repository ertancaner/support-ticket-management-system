import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { PlusCircle, Ticket } from 'lucide-react';

export const TicketsListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Destek Talepleri</h1>
          <p className="text-sm text-slate-600 mt-0.5">Tüm destek taleplerinizi listeleyin ve durumlarını takip edin</p>
        </div>
        <Link to="/tickets/new">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            <span>Yeni Talep</span>
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
        <Ticket className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Destek Talepleri Listesi</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Kullanıcı ekranları Faz 18 kapsamında tüm filtreleme, arama ve sayfalama özellikleriyle bağlanacaktır.
        </p>
      </div>
    </div>
  );
};
