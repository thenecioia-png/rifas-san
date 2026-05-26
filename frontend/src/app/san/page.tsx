'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Users, Calendar, DollarSign, ChevronRight, TrendingUp } from 'lucide-react';
import { sanApi } from '../../services/api';

export default function SanPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['san-groups'],
    queryFn: () => sanApi.getGroups(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Grupos SAN</h1>
          <p className="text-dark-400 mt-1">
            Participa en grupos de ahorro colectivo rotativo
          </p>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary-500/10 text-primary-400">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-dark-200">¿Qué es SAN?</h3>
          </div>
          <p className="text-sm text-dark-400">
            Sistema de Ahorro rotativo donde los participantes contribuyen 
            periódicamente y reciben el monto total en su turno.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success-500/10 text-success-500">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-dark-200">Beneficios</h3>
          </div>
          <p className="text-sm text-dark-400">
            Acceso a capital sin intereses, disciplina de ahorro, 
            y apoyo comunitario garantizado.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning-500/10 text-warning-500">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-dark-200">Cómo funciona</h3>
          </div>
          <p className="text-sm text-dark-400">
            Únete a un grupo, paga tus cuotas puntualmente, 
            y recibe tu turno según el orden establecido.
          </p>
        </motion.div>
      </div>

      {/* SAN Groups */}
      <div>
        <h2 className="text-lg font-semibold text-dark-100 mb-4">
          Grupos Disponibles
        </h2>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-6 bg-dark-800 rounded w-1/3 mb-2" />
                <div className="h-4 bg-dark-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {data?.data?.map((group: any, index: number) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/san/${group.id}`}>
                  <div className="card-hover p-6 group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-dark-100 group-hover:text-primary-400 transition-colors">
                            {group.name}
                          </h3>
                          <span className={`badge ${
                            group.status === 'ACTIVE' ? 'badge-success' :
                            group.status === 'PENDING' ? 'badge-warning' :
                            'badge-info'
                          }`}>
                            {group.status === 'ACTIVE' ? 'Activo' :
                             group.status === 'PENDING' ? 'Pendiente' :
                             group.status === 'COMPLETED' ? 'Completado' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-sm text-dark-400 mb-3">
                          {group.description || 'Sin descripción'}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-dark-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {group._count?.members || 0}/{group.totalMembers} miembros
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${Number(group.contributionAmount).toFixed(2)} / {group.frequency === 'WEEKLY' ? 'semana' : 'mes'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Inicio: {new Date(group.startDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && (!data?.data || data.data.length === 0) && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto text-dark-600 mb-4" />
            <h3 className="text-lg font-medium text-dark-300 mb-2">
              No hay grupos disponibles
            </h3>
            <p className="text-dark-500">
              No se encontraron grupos SAN activos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
