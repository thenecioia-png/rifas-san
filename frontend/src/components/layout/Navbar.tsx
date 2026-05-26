'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import toast from 'react-hot-toast';

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      toast.success('Sesión cerrada exitosamente');
      router.push('/login');
    } catch (error) {
      logout();
      router.push('/login');
    }
  };

  return (
    <nav className="glass sticky top-0 z-40 border-b border-dark-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gradient">
                Rifas & SAN
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-dark-200">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-dark-500 capitalize">
                  {user?.role?.toLowerCase()}
                </span>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-dark-400 hover:text-danger-400 hover:bg-danger-500/10 transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
