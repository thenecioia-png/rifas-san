'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Ticket, Calendar, Users, ChevronRight } from 'lucide-react';
import { rafflesApi } from '../../services/api';

export default function RafflesPage() {
  const [filter, setFilter] = useState('ACTIVE');
  
  const { data, isLoading } = useQuery({
    queryKey: ['raffles', filter],
    queryFn: () => rafflesApi.getAll({ status: filter, page: 1, limit: 20 }),
  });

  const filters = [
    { value: 'ACTIVE', label: 'Activas' },
    { value: 'SOLD_OUT', label: 'Agotadas' },
    { value: 'DRAWN', label: 'Sorteadas' },
    { value: 'COMPLETED', label: 'Completadas' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-100">Rifas</h1>
          <p className="text-dark-400 mt-1">
            Participa en rifas y gana increíbles premios
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${filter === f.value
                ? 'bg-primary-600 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-dark-200 hover:bg-dark-700'
              }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Raffles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-48 bg-dark-800 rounded-lg mb-4" />
              <div className="h-6 bg-dark-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-dark-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data?.data?.map((raffle: any, index: number) => (
            <motion.div
              key={raffle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/raffles/${raffle.id}`}>
                <div className="card-hover overflow-hidden group">
                  {/* Image Placeholder */}
                  <div className="h-48 bg-gradient-to-br from-primary-600/20 to-primary-800/20 flex items-center justify-center relative overflow-hidden">
                    <Ticket className="w-16 h-16 text-primary-400/50 group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute top-3 right-3">
                      <span className={`badge ${
                        raffle.status === 'ACTIVE' ? 'badge-success' :
                        raffle.status === 'SOLD_OUT' ? 'badge-warning' :
                        'badge-info'
                      }`}>
                        {raffle.status === 'ACTIVE' ? 'Activa' :
                         raffle.status === 'SOLD_OUT' ? 'Agotada' :
                         raffle.status === 'DRAWN' ? 'Sorteada' : 'Completada'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-dark-100 mb-2 group-hover:text-primary-400 transition-colors">
                      {raffle.title}
                    </h3>
                    <p className="text-sm text-dark-400 mb-4 line-clamp-2">
                      {raffle.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-500">Premio:</span>
                        <span className="text-primary-400 font-semibold">
                          ${Number(raffle.prizeValue).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-dark-500">Precio:</span>
                        <span className="text-dark-200">
                          ${Number(raffle.ticketPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-dark-800">
                      <div className="flex items-center gap-4 text-sm text-dark-500">
                        <span className="flex items-center gap-1">
                          <Ticket className="w-4 h-4" />
                          {raffle.ticketsSold}/{raffle.totalTickets}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(raffle.drawDate).toLocaleDateString()}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-dark-500 group-hover:text-primary-400 transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {!isLoading && data?.data?.data?.length === 0 && (
        <div className="text-center py-16">
          <Ticket className="w-16 h-16 mx-auto text-dark-600 mb-4" />
          <h3 className="text-lg font-medium text-dark-300 mb-2">
            No hay rifas disponibles
          </h3>
          <p className="text-dark-500">
            No se encontraron rifas en esta categoría
          </p>
        </div>
      )}
    </div>
  );
}
