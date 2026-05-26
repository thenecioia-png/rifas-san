# 🏦 Rifas & SAN - Plataforma Financiera

Sistema profesional de **rifas online** y **ahorro colectivo rotativo (SAN)** construido con arquitectura enterprise-grade.

## 🎯 Características Principales

### Sistema de Rifas
- ✅ Creación de rifas con premios personalizados
- ✅ Venta de números/boletos con reservas temporales (10 min)
- ✅ Prevención de doble venta con locks Redis + transacciones SQL
- ✅ Sorteo aleatorio criptográficamente seguro
- ✅ Panel de boletos en tiempo real

### Sistema SAN (Ahorro Rotativo)
- ✅ Creación de grupos de ahorro colectivo
- ✅ Sistema de turnos automático
- ✅ Control de pagos y morosidad
- ✅ Tabla de amortización y cronograma
- ✅ Alertas automáticas de atraso

### Seguridad Bancaria
- ✅ JWT + Refresh Tokens (HTTP-only cookies)
- ✅ Argon2id para hash de contraseñas
- ✅ Rate limiting por endpoint
- ✅ Auditoría completa e inmutable
- ✅ RBAC con 4 niveles de roles
- ✅ CSRF, XSS, SQL Injection protection
- ✅ Bloqueo por intentos fallidos

### Pagos
- ✅ Arquitectura lista para Stripe, MercadoPago, PayPal
- ✅ Webhooks seguros con verificación de firmas
- ✅ Prevención de pagos duplicados
- ✅ Estados: pending → paid → refunded

### Infraestructura
- ✅ Docker + Docker Compose
- ✅ PostgreSQL 16 con backups automatizados
- ✅ Redis para cache y locks distribuidos
- ✅ NGINX con SSL/TLS y rate limiting
- ✅ WebSockets para tiempo real

## 🚀 Inicio Rápido

### Requisitos
- Node.js 20+
- Docker & Docker Compose
- Git

### Instalación

```bash
# 1. Clonar repositorio
git clone <repository>
cd fintech-rifas-san

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 3. Iniciar con Docker
docker-compose up -d

# 4. Ejecutar migraciones
cd backend
npm install
npx prisma migrate deploy
npx prisma generate

# 5. Iniciar desarrollo
npm run start:dev

# Frontend (en otra terminal)
cd ../frontend
npm install
npm run dev
```

### Acceso
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Swagger Docs: http://localhost:3001/api/v1/docs

## 📁 Estructura del Proyecto

```
fintech-rifas-san/
├── backend/                 # NestJS API
│   src/
│   ├── auth/               # Autenticación JWT + Argon2
│   ├── users/              # Gestión de usuarios
│   ├── raffles/            # Sistema de rifas
│   ├── san/                # Sistema de ahorro rotativo
│   ├── payments/           # Procesamiento de pagos
│   ├── wallet/             # Billetera virtual
│   ├── audit/              # Logs de auditoría
│   ├── admin/              # Panel administrativo
│   ├── notifications/      # WebSocket + notificaciones
│   ├── common/             # Guards, interceptors, decorators
│   ├── prisma/             # Prisma ORM
│   └── redis/              # Redis service
├── frontend/               # Next.js 14
│   src/
│   ├── app/                # Pages (App Router)
│   ├── components/         # Componentes React
│   ├── hooks/              # Custom hooks
│   ├── stores/             # Zustand stores
│   ├── services/           # API services (Axios)
│   └── types/              # TypeScript types
├── database/               # Esquemas y migraciones
├── infra/                  # NGINX, Docker configs
├── scripts/                # Scripts de backup y utilidades
└── docs/                   # Documentación técnica
```

## 🔐 Seguridad

### Autenticación
- JWT access tokens (15 min)
- Refresh tokens rotativos (7 días) en HTTP-only cookies
- Argon2id con memory cost 65536
- Bloqueo automático tras 5 intentos fallidos
- Revocación de sesiones

### Autorización
- RBAC: SUPER_ADMIN, ADMIN, MODERATOR, USER
- Decoradores @Roles() y @Public()
- Guards en controller level

### Protección de Datos
- Prisma ORM previene SQL injection
- Helmet headers contra XSS/clickjacking
- Validación estricta con class-validator
- Sanitización de inputs sensibles en audit logs
- Rate limiting por IP y endpoint

## 💾 Base de Datos

### Tablas Principales
- `users` - Usuarios con roles y estado
- `raffles` - Definición de rifas
- `tickets` - Boletos con estados (available, reserved, sold)
- `san_groups` - Grupos de ahorro
- `san_members` - Miembros con orden de turnos
- `payments` - Pagos con trazabilidad completa
- `audit_logs` - Logs inmutables
- `wallets` - Billeteras virtuales
- `transactions` - Historial de transacciones

### Características
- Índices optimizados en columnas frecuentes
- Constraints de integridad referencial
- Transacciones SERIALIZABLE para operaciones críticas
- Soft deletes en tablas principales

## 🔄 Flujo de Rifa (Seguridad)

```
1. Usuario selecciona números
2. Redis lock adquirido (previene condiciones de carrera)
3. Transacción SQL SERIALIZABLE
4. Números marcados como RESERVED (10 min timeout)
5. Usuario completa pago
6. Webhook confirma pago
7. Números marcados como SOLD
8. WebSocket notifica en tiempo real
9. Si expira: liberación automática vía cron
```

## 💰 Pagos

### Proveedores Soportados
- Stripe
- MercadoPago
- PayPal
- Transferencia bancaria (manual)
- Billetera interna

### Seguridad
- Verificación de firmas de webhook
- Idempotency keys en Redis
- Prevención de duplicados
- Estados atómicos: pending → processing → paid

## 📊 Panel Administrativo

### Métricas en Tiempo Real
- Usuarios activos y registrados
- Ventas de boletos
- Ingresos diarios/acumulados
- Grupos SAN activos
- Pagos pendientes

### Gestión
- CRUD de rifas
- Gestión de usuarios y roles
- Control de pagos y reembolsos
- Auditoría completa de acciones
- Exportación de datos

## 🛡️ Backups y Recuperación

### Automatización
- Backups diarios de PostgreSQL
- Retención de 30 días
- Checksums SHA-256
- Upload opcional a S3

### Recuperación
```bash
# Restaurar desde backup
gunzip <backup_file>.sql.gz
psql -U rifas_admin -d rifas_san_db < <backup_file>.sql
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm run test
npm run test:e2e

# Frontend tests
cd frontend
npm run test
```

## 📈 Escalabilidad

- Stateless backend (horizontal scaling)
- Redis para sesiones y cache
- PostgreSQL con connection pooling
- NGINX load balancing
- Docker Swarm / Kubernetes ready

## 📞 Soporte

Para soporte técnico o reportar vulnerabilidades:
- Email: devops@rifas-san.com
- Issues: GitHub Issues

## 📄 Licencia

PROPIETARIA - Todos los derechos reservados.

---

**Construido con ❤️ para la comunidad financiera.**
