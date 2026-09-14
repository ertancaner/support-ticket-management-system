import React from 'react';
import { FolderKanban } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kategori Yönetimi</h1>
        <p className="text-sm text-slate-600 mt-0.5">Sistem kategorilerini oluşturun, güncelleyin ve durumlarını yönetin</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
        <FolderKanban className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Admin Kategori Paneli</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Kategori CRUD işlemleri Faz 19 kapsamında bağlanacaktır.
        </p>
      </div>
    </div>
  );
};
