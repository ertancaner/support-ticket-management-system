import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/common/Badge';
import { LogOut, Ticket, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">
                Destek Talebi Sistemi
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                v1.0
              </span>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                <UserIcon className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-900">{user.username}</span>
                <Badge type="role" value={user.role} />
              </div>

              <button
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-rose-50"
                title="Çıkış Yap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Çıkış</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
