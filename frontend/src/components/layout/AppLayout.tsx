import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { ChangePasswordModal } from '@/components/auth/ChangePasswordModal';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mandatory password change modal on first login / admin reset */}
      {user?.mustChangePassword && (
        <ChangePasswordModal
          isOpen={true}
          isForced={true}
        />
      )}
    </div>
  );
};
