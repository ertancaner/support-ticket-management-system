import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  Ticket,
  PlusCircle,
  FolderKanban,
  Users,
  ShieldAlert
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin } = useAuth();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-6">
        <div>
          <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Destek Menüsü
          </div>
          <nav className="space-y-1">
            <NavLink to="/tickets" end className={navLinkClasses}>
              <Ticket className="w-4 h-4 shrink-0" />
              <span>Destek Talepleri</span>
            </NavLink>
            <NavLink to="/tickets/new" className={navLinkClasses}>
              <PlusCircle className="w-4 h-4 shrink-0" />
              <span>Yeni Talep Aç</span>
            </NavLink>
          </nav>
        </div>

        {isAdmin && (
          <div>
            <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Yönetici Paneli
            </div>
            <nav className="space-y-1">
              <NavLink to="/categories" className={navLinkClasses}>
                <FolderKanban className="w-4 h-4 shrink-0" />
                <span>Kategori Yönetimi</span>
              </NavLink>
              <NavLink to="/users" className={navLinkClasses}>
                <Users className="w-4 h-4 shrink-0" />
                <span>Kullanıcı Yönetimi</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {user?.mustChangePassword && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Geçici Şifre Uyarısı</span>
            Lütfen şifrenizi en kısa sürede güncelleyin.
          </div>
        </div>
      )}
    </aside>
  );
};
