import React from 'react';
import { Users } from 'lucide-react';

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kullanıcı Yönetimi</h1>
        <p className="text-sm text-slate-600 mt-0.5">Kullanıcıları oluşturun, şifrelerini sıfırlayın ve durumlarını kontrol edin</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 shadow-sm">
        <Users className="w-12 h-12 mx-auto text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-800">Admin Kullanıcı Paneli</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          Kullanıcı listesi, oluşturma ve şifre sıfırlama Faz 19 kapsamında bağlanacaktır.
        </p>
      </div>
    </div>
  );
};
