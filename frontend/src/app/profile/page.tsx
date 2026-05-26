'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield, Calendar } from 'lucide-react';
import { usersApi } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.getMe(),
  });

  useEffect(() => {
    if (user?.data) {
      setFormData({
        firstName: user.data.firstName || '',
        lastName: user.data.lastName || '',
        phone: user.data.phone || '',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => usersApi.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setIsEditing(false);
      toast.success('Perfil actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  const userData = user?.data;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark-100">Mi Perfil</h1>
        <p className="text-dark-400 mt-1">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center text-white text-2xl font-bold">
            {userData?.firstName?.[0]}{userData?.lastName?.[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-dark-100">
              {userData?.firstName} {userData?.lastName}
            </h2>
            <p className="text-dark-500 capitalize">{userData?.role?.toLowerCase()}</p>
          </div>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-dark-800">
              <Mail className="w-5 h-5 text-dark-500" />
              <div>
                <p className="text-sm text-dark-500">Correo Electrónico</p>
                <p className="text-dark-200">{userData?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-dark-800">
              <Phone className="w-5 h-5 text-dark-500" />
              <div>
                <p className="text-sm text-dark-500">Teléfono</p>
                <p className="text-dark-200">{userData?.phone || 'No registrado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b border-dark-800">
              <Shield className="w-5 h-5 text-dark-500" />
              <div>
                <p className="text-sm text-dark-500">Verificación</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${userData?.emailVerified ? 'bg-success-500' : 'bg-warning-500'}`} />
                  <span className="text-dark-200">
                    {userData?.emailVerified ? 'Verificado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3">
              <Calendar className="w-5 h-5 text-dark-500" />
              <div>
                <p className="text-sm text-dark-500">Miembro desde</p>
                <p className="text-dark-200">
                  {new Date(userData?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary w-full mt-4"
            >
              Editar Perfil
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
