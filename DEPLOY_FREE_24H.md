# 🚀 DESPLIEGUE GRATIS 24/7 - RIFAS & SAN

## Arquitectura
```
Vercel (Frontend Next.js 24/7 gratis)
  ↓
Render (Backend NestJS 24/7 gratis + auto-ping)
  ↓
Neon (PostgreSQL gratis perpetuo)
Upstash (Redis gratis)
```

## PASO 1: Base de Datos (Neon)
1. Ir a https://neon.tech
2. Crear cuenta con GitHub
3. Crear proyecto `rifas-san`
4. Copiar el **Connection String** (seleccionar Prisma)
   ```
   postgresql://usuario:password@ep-xxx.neon.tech/rifas_san_db?sslmode=require
   ```

## PASO 2: Redis (Upstash)
1. Ir a https://upstash.com
2. Crear cuenta con GitHub
3. "Create Database" → Name: `rifas-san-redis` → Type: `Regional` → Region: `us-east-1`
4. Copiar el **Redis URL**:
   ```
   rediss://default:password@xxx.upstash.io:6379
   ```

## PASO 3: Backend en Render
1. Ir a https://render.com → Sign up con GitHub
2. Subir este repo a GitHub (si no lo has hecho)
3. Dashboard → "New +" → "Blueprint"
4. Conectar tu repo de GitHub
5. Render detectará `render.yaml` automáticamente
6. En las variables de entorno que piden **sync: false**, completar manualmente:
   - `DATABASE_URL`: URL de Neon (paso 1)
   - `REDIS_URL`: URL de Upstash (paso 2)
   - `FRONTEND_URL`: la URL que te dará Vercel en el paso 4 (después la actualizas)
7. Click "Apply"

**El backend ya tiene auto-ping incorporado.** Cada 14 minutos se pinguea a sí mismo para nunca dormirse.

## PASO 4: Frontend en Vercel
1. Ir a https://vercel.com → Sign up con GitHub
2. "Add New Project"
3. Seleccionar tu repo
4. Configuración:
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://rifas-san-backend.onrender.com/api/v1
   ```
6. Click "Deploy"

## PASO 5: Actualizar CORS
1. Copiar la URL de Vercel (ej: `https://rifas-san-frontend.vercel.app`)
2. Ir a Render → tu servicio → Environment
3. Actualizar `FRONTEND_URL` con la URL real de Vercel
4. Render redeployeará automáticamente

## ✅ Verificación
| URL | Resultado esperado |
|-----|-------------------|
| `https://tu-backend.onrender.com/api/v1/health/ping` | `{"status":"ok"}` |
| `https://tu-backend.onrender.com/api/v1/health` | status + database + redis |
| `https://tu-frontend.vercel.app` | Login de la app |

## 📋 Variables clave que ya están configuradas en código
- `RENDER=true` → activa el auto-ping
- `SELF_URL` → URL que se auto-pinguea cada 14 min
- Health check ligero `/api/v1/health/ping` → no depende de DB/Redis

## ⚠️ Límites del tier gratuito
| Servicio | Límite |
|----------|--------|
| Render | 750h/mes = 24/7 real, 512MB RAM |
| Neon | 10GB storage, cold start en 1er query (normal) |
| Upstash | 10MB storage, 10K requests/día |
| Vercel | 100GB bandwidth/mes |

> Si necesitas más Redis, considera Railway ($5/mes) o pasar a Oracle Cloud.
