'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Ticket,
  Users,
  CreditCard,
  Wallet,
  Settings,
  Shield,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const userMenuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/raffles', label: 'Rifas', icon: Ticket },
  { href: '/san', label: 'Grupos SAN', icon: Users },
  { href: '/payments', label: 'Pagos', icon: CreditCard },
  { href: '/wallet', label: 'Billetera', icon: Wallet },
  { href: '/profile', label: 'Perfil', icon: Settings },
];

const adminMenuItems = [
  { href: '/admin', label: 'Panel Admin', icon: Shield },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const menuItems = isAdmin
    ? [...userMenuItems, ...adminMenuItems]
    : userMenuItems;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-dark-900 border-r border-dark-800 flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="text-xl font-bold text-gradient">Menú</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-primary-600/10 text-primary-400 border border-primary-600/20'
                    : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-dark-800">
          <div className="bg-dark-800/50 rounded-lg p-3">
            <p className="text-xs text-dark-500 mb-1">Saldo Disponible</p>
            <p className="text-lg font-semibold text-dark-100">$0.00</p>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
