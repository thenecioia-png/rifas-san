'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  Ticket,
  CreditCard,
  TrendingUp,
  Shield,
  Activity,
} from 'lucide-react';
import { adminApi } from '../../services/api';

export default function AdminPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getDashboardStats(),
  });

  const dashboardStats = stats?.data || {};

  const statCards = [
    {
      title: 'Total Usuarios',
      value: dashboardStats.users?.total || 0,
      active: dashboardStats.users?.active || 0,
      icon: Users,
      color: 'primary',
    },
    {
      title: 'Rifas Activas',
      value: dashboardStats.raffles?.active || 0,
      total: dashboardStats.raffles?.total || 0,
      icon: Ticket,
      color: 'success',
    },
    {
      title: 'Grupos SAN',
      value: dashboardStats.san?.active || 0,
      total: dashboardStats.san?.total || 0,
      icon: Activity,
      color: 'warning',
    },
    {
      title: 'Ingresos Hoy',
      value: `$${Number(dashboardStats.payments?.todayRevenue || 0).toFixed(2)}`,
      total: `$${Number(dashboardStats.payments?.totalRevenue || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'info',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-primary-400" />
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Panel de Administración</h1>
          <p className="text-dark-400">Gestión completa de la plataforma</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-16 bg-dark-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            const colorMap: Record<string, string> = {
              primary: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
              success: 'bg-success-500/10 text-success-500 border-success-500/20',
              warning: 'bg-warning-500/10 text-warning-500 border-warning-500/20',
              info: 'bg-primary-400/10 text-primary-300 border-primary-400/20',
            };

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg border ${colorMap[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-sm text-dark-400">{stat.title}</p>
                <p className="text-2xl font-bold text-dark-100 mt-1">
                  {stat.value}
                </p>
                {stat.active !== undefined && (
                  <p className="text-xs text-success-500 mt-1">
                    {stat.active} activos
                  </p>
                )}
                {stat.total !== undefined && typeof stat.total === 'number' && (
                  <p className="text-xs text-dark-500 mt-1">
                    de {stat.total} total
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-4">
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors">
              <Ticket className="w-6 h-6 text-primary-400 mb-2" />
              <p className="text-sm font-medium text-dark-200">Nueva Rifa</p>
            </button>
            <button className="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors">
              <Users className="w-6 h-6 text-success-500 mb-2" />
              <p className="text-sm font-medium text-dark-200">Nuevo Grupo SAN</p>
            </button>
            <button className="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors">
              <CreditCard className="w-6 h-6 text-warning-500 mb-2" />
              <p className="text-sm font-medium text-dark-200">Ver Pagos</p>
            </button>
            <button className="p-4 bg-dark-800 hover:bg-dark-700 rounded-lg text-left transition-colors">
              <Activity className="w-6 h-6 text-primary-300 mb-2" />
              <p className="text-sm font-medium text-dark-200">Auditoría</p>
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h2 className="text-lg font-semibold text-dark-100 mb-4">
            Estado del Sistema
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <span className="text-dark-400">Base de Datos</span>
              <span className="flex items-center gap-2 text-success-500">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Operacional
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-dark-400">Redis Cache</span>
              <span className="flex items-center gap-2 text-success-500">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Operacional
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-dark-400">API Backend</span>
              <span className="flex items-center gap-2 text-success-500">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Operacional
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-dark-400">WebSocket</span>
              <span className="flex items-center gap-2 text-success-500">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
                Operacional
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
