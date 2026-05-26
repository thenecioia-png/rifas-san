# 🚀 GUÍA DE DESPLIEGUE GRATUITO EN LA NUBE

## ⚡ OPCIÓN RÁPIDA (Todo Gratis - 10 minutos)

### Arquitectura Gratuita Recomendada
```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Render     │────▶│   Neon      │
│  (Frontend) │     │  (Backend)   │     │ (Postgres)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Upstash    │
                    │   (Redis)    │
                    └──────────────┘
```

**Costo: $0 / mes | Tiempo: ~10 minutos**

---

## 📋 PASO 1: Preparar el Proyecto

### 1.1 Crear repositorio en GitHub
```bash
# En tu computadora, dentro de la carpeta fintech-rifas-san
git init
git add .
git commit -m "Initial commit - Rifas & SAN Platform"

# Crear repo en GitHub y subir
git branch -M main
git remote add origin https://github.com/TU_USUARIO/rifas-san.git
git push -u origin main
```

> ⚠️ **IMPORTANTE**: Reemplaza `TU_USUARIO` con tu usuario real de GitHub.

### 1.2 Modificar render.yaml
Edita `render.yaml` y reemplaza:
- `TU_USUARIO/TU_REPO` → tu usuario/repo real de GitHub
- `TU_FRONTEND.vercel.app` → lo pondrás después del paso 2

---

## 🌐 PASO 2: Desplegar Frontend en VERCEL (Gratis)

### 2.1 Registro
1. Ve a https://vercel.com
2. Regístrate con tu cuenta de GitHub (es gratis)
3. Click en **"Add New Project"**

### 2.2 Importar Proyecto
1. Selecciona tu repositorio `rifas-san`
2. En la configuración:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

3. En **Environment Variables**, agrega:
   ```
   NEXT_PUBLIC_API_URL=https://rifas-san-backend.onrender.com/api/v1
   ```
   > Nota: Cambiarás esta URL después del paso 3.

4. Click **Deploy**

### 2.3 Obtener URL
- Espera ~2 minutos
- Vercel te dará una URL tipo: `https://rifas-san-frontend.vercel.app`
- **Guarda esta URL**, la necesitarás para el backend

---

## ⚙️ PASO 3: Crear Base de Datos NEON (Gratis)

### 3.1 Registro
1. Ve a https://neon.tech
2. Regístrate con GitHub (gratis, 10GB)
3. Crea un nuevo proyecto llamado `rifas-san`

### 3.2 Obtener Connection String
1. En el dashboard de Neon, ve a **Connection Details**
2. Selecciona **Prisma** como framework
3. Copia la URL que se ve así:
   ```
   postgresql://rifas_admin:password@ep-xxx.us-east-1.aws.neon.tech/rifas_san_db?sslmode=require
   ```
4. **Guarda esta URL**, la necesitarás para Render

---

## 🔴 PASO 4: Crear Redis en UPSTASH (Gratis)

### 4.1 Registro
1. Ve a https://upstash.com
2. Regístrate con GitHub (gratis)
3. Click en **"Create Database"**

### 4.2 Configuración
1. **Name**: `rifas-san-redis`
2. **Region**: `us-east-1` (cerca de tu backend)
3. **Type**: `Regional` (gratis)
4. Click **Create**

### 4.3 Obtener URL
1. Ve a la pestaña **Details**
2. Copia el **Redis URL** (se ve así):
   ```
   rediss://default:password@xxx.upstash.io:6379
   ```
3. **Guarda esta URL**

---

## 🔧 PASO 5: Desplegar Backend en RENDER (Gratis)

### 5.1 Registro
1. Ve a https://render.com
2. Regístrate con GitHub (gratis)
3. Ve al dashboard y click en **"Blueprints"**

### 5.2 Crear Blueprint (Modo Fácil)
**Opción A - Desde archivo render.yaml:**
1. Click **"New Blueprint Instance"**
2. Conecta tu repositorio de GitHub
3. Render detectará automáticamente el `render.yaml`
4. Reemplaza las variables que pide:
   - `FRONTEND_URL`: URL de Vercel del paso 2
   - `DATABASE_URL`: URL de Neon del paso 3
   - `REDIS_URL`: URL de Upstash del paso 4

**Opción B - Manual (si Blueprint falla):**
1. En el dashboard, click **"New +"** → **"Web Service"**
2. Conecta tu repo, selecciona la rama `main`
3. Configura:
   - **Name**: `rifas-san-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`

4. En **Environment Variables**, agrega:
   ```
   NODE_ENV=production
   PORT=3001
   HOST=0.0.0.0
   API_PREFIX=/api/v1
   DATABASE_URL=postgresql://... (URL de Neon)
   REDIS_URL=rediss://... (URL de Upstash)
   JWT_SECRET=genera_un_secreto_largo_aqui_minimo_64_caracteres
   JWT_REFRESH_SECRET=otro_secreto_largo_diferente_64_caracteres
   FRONTEND_URL=https://rifas-san-frontend.vercel.app (tu URL de Vercel)
   ```

5. Click **Create Web Service**

### 5.3 Ejecutar Migraciones (Solo la primera vez)
1. Ve a la pestaña **Shell** de tu servicio en Render
2. Ejecuta:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

### 5.4 Obtener URL del Backend
- Espera ~5 minutos a que el deploy termine
- Tu backend estará en: `https://rifas-san-backend.onrender.com`
- **Prueba**: Abre `https://rifas-san-backend.onrender.com/api/v1/health`
- Debería responder: `{"status":"ok","database":"ok","redis":"ok"}`

---

## 🔄 PASO 6: Actualizar Frontend con URL del Backend

### 6.1 Vercel Environment Variables
1. Ve a tu proyecto en Vercel dashboard
2. Ve a **Settings** → **Environment Variables**
3. Actualiza:
   ```
   NEXT_PUBLIC_API_URL=https://rifas-san-backend.onrender.com/api/v1
   ```
   (Usa tu URL real de Render)

4. Vercel redeployará automáticamente

---

## ✅ PASO 7: Verificar Todo Funciona

### Checklist de Verificación

| URL | Qué debe mostrar |
|-----|-----------------|
| `https://TU_FRONTEND.vercel.app` | Login de la plataforma |
| `https://TU_BACKEND.onrender.com/api/v1/health` | `{"status":"ok"}` |
| `https://TU_BACKEND.onrender.com/api/v1/raffles` | Lista de rifas (JSON) |

### Prueba de Flujo Completo
1. Registra un usuario nuevo
2. Crea una rifa (como admin)
3. Reserva boletos
4. Verifica en la base de datos (Neon SQL Editor)

---

## 🛠️ SOLUCIÓN DE PROBLEMAS

### Error: "Cannot connect to database"
- Verifica que la `DATABASE_URL` sea correcta
- En Neon, asegúrate de habilitado **Connection to database**
- Agrega `?sslmode=require` al final de la URL

### Error: "Redis connection failed"
- Verifica la `REDIS_URL` de Upstash
- Asegúrate de usar `rediss://` (con S, es SSL)
- Si Render no conecta, prueba cambiando a `redis://` (sin SSL)

### Error: "CORS blocked"
- Actualiza `FRONTEND_URL` en Render con la URL exacta de Vercel
- Incluye `https://` y sin slash al final

### Backend se duerme (Render free tier)
- **Normal**: Render free se duerme tras 15 min de inactividad
- **Solución**: Usa https://uptimerobot.com (gratis) para hacer ping cada 5 min
- O upgradea a Render Starter ($7/mes)

### Base de datos lenta
- Neon free tiene "cold start" (despierta tras inactividad)
- Primera consulta puede tardar 1-2 segundos
- Esto es normal en tier gratuito

---

## 📊 LÍMITES DE TIER GRATUITO

| Servicio | Límite Gratis |
|----------|--------------|
| **Vercel** | 100GB bandwidth/mes, builds ilimitados |
| **Render** | 512MB RAM, se duerme tras 15min inactivo |
| **Neon** | 10GB storage, 190 compute hours/mes |
| **Upstash** | 10MB storage, 10K requests/día |

> 💡 **Para producción real con dinero**: Upgradea Render a Starter ($7/mes) + Neon a Pro ($19/mes) = ~$26/mes total.

---

## 🚀 COMANDOS ÚTILES

### Ver logs en tiempo real
```bash
# Render (instalar CLI)
npm install -g @render/cli
render logs --service rifas-san-backend

# O desde el dashboard web
```

### Conectar a base de datos Neon
```bash
psql "postgresql://rifas_admin:password@ep-xxx.neon.tech/rifas_san_db?sslmode=require"
```

### Forzar redeploy
- **Vercel**: Cualquier push a `main` redeploya automático
- **Render**: Click "Manual Deploy" → "Deploy latest commit"

---

## 🎉 ¡LISTO!

Tu plataforma Rifas & SAN está en internet completamente GRATIS.

**URLs que obtendrás:**
- 🌐 Frontend: `https://rifas-san-frontend.vercel.app`
- ⚙️ Backend API: `https://rifas-san-backend.onrender.com/api/v1`
- 🗄️ Base de datos: Neon (acceso solo backend)
- ⚡ Redis: Upstash (acceso solo backend)

---

## 📞 Si algo falla

1. Revisa los **logs** en el dashboard de cada servicio
2. Verifica que todas las **variables de entorno** estén correctas
3. Prueba el endpoint `/api/v1/health` para diagnosticar
4. Asegúrate de que las **migraciones Prisma** se ejecutaron
