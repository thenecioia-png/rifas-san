'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  Ticket,
  Users,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
} from 'lucide-react';
import { rafflesApi, sanApi, walletApi } from '../../services/api';
import Link from 'next/link';

const statsCards = [
  { title: 'Mis Boletos', icon: Ticket, color: 'primary', api: 'tickets' },
  { title: 'Mis Grupos SAN', icon: Users, color: 'success', api: 'san' },
  { title: 'Transacciones', icon: CreditCard, color: 'warning', api: 'payments' },
  { title: 'Saldo', icon: TrendingUp, color: 'info', api: 'wallet' },
];

export default function DashboardPage() {
  const { data: ticketsData } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: () => rafflesApi.getMyTickets(),
  });

  const { data: sanData } = useQuery({
    queryKey: ['my-san-groups'],
    queryFn: () => sanApi.getMyGroups(),
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => walletApi.getWallet(),
  });

  const stats = [
    {
      title: 'Mis Boletos',
      value: ticketsData?.data?.length || 0,
      icon: Ticket,
      color: 'primary',
      link: '/raffles',
    },
    {
      title: 'Grupos SAN',
      value: sanData?.data?.length || 0,
      icon: Users,
      color: 'success',
      link: '/san',
    },
    {
      title: 'Saldo',
      value: `$${Number(walletData?.data?.balance || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'warning',
      link: '/wallet',
    },
    {
      title: 'Transacciones',
      value: walletData?.data?.transactions?.length || 0,
      icon: CreditCard,
      color: 'info',
      link: '/payments',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Dashboard</h1>
        <p className="text-dark-400 mt-1">
          Resumen de tu actividad en la plataforma
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
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
            >
              <Link href={stat.link}>
                <div className="card-hover p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-dark-400">{stat.title}</p>
                      <p className="text-2xl font-bold text-dark-100 mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg border ${colorMap[stat.color]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100">
              Últimas Transacciones
            </h2>
            <Link
              href="/payments"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Ver todas
            </Link>
          </div>
          
          {walletData?.data?.transactions?.length > 0 ? (
            <div className="space-y-3">
              {walletData?.data?.transactions?.slice(0, 5).map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 border-b border-dark-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                      ${tx.amount > 0 ? 'bg-success-500/10 text-success-500' : 'bg-danger-500/10 text-danger-500'}`}>
                      {tx.amount > 0 ? '+' : '-'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">
                        {tx.description}
                      </p>
                      <p className="text-xs text-dark-500">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold
                    ${tx.amount > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No hay transacciones recientes</p>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-100">
              Mis Rifas Activas
            </h2>
            <Link
              href="/raffles"
              className="text-sm text-primary-400 hover:text-primary-300"
            >
              Ver todas
            </Link>
          </div>
          
          {ticketsData?.data?.length > 0 ? (
            <div className="space-y-3">
              {ticketsData?.data?.slice(0, 5).map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between py-3 border-b border-dark-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark-200">
                        {ticket.raffle.title}
                      </p>
                      <p className="text-xs text-dark-500">
                        Boleta #{ticket.ticketNumber}
                      </p>
                    </div>
                  </div>
                  <span className={`badge ${
                    ticket.status === 'SOLD' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {ticket.status === 'SOLD' ? 'Comprada' : 'Reservada'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-dark-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No tienes boletos activos</p>
              <Link
                href="/raffles"
                className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block"
              >
                Explorar rifas
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
