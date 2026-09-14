import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { HelpCircle } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mb-4">
        <HelpCircle className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Sayfa Bulunamadı</h1>
      <p className="text-slate-600 max-w-md mb-6">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <Link to="/tickets">
        <Button>Ana Sayfaya Dön</Button>
      </Link>
    </div>
  );
};
