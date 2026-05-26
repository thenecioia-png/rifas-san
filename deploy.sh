#!/bin/bash
# ============================================
# SCRIPT DE PREPARACIÓN PARA DESPLIEGUE
# ============================================
# Este script prepara el proyecto para subir a GitHub
# y desplegar en la nube gratuita.
#
# NO despliega automáticamente - solo prepara los archivos.
# Sigue la guía DEPLOY.md para el despliegue real.
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

echo "=========================================="
echo "  RIFAS & SAN - PREPARACIÓN DEPLOY"
echo "=========================================="
echo ""

# Verificar que estamos en la carpeta correcta
if [ ! -f "docker-compose.yml" ]; then
    log_error "No se encontró docker-compose.yml. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

log_step "1. Verificando estructura del proyecto..."

# Verificar archivos críticos
FILES=(
    "backend/package.json"
    "backend/Dockerfile"
    "frontend/package.json"
    "frontend/Dockerfile"
    "database/schema.prisma"
    "docker-compose.yml"
    "render.yaml"
    "DEPLOY.md"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        log_info "✅ $file"
    else
        log_error "❌ $file NO ENCONTRADO"
        exit 1
    fi
done

echo ""
log_step "2. Configurando Git..."

if [ ! -d ".git" ]; then
    git init
    log_info "Repositorio Git inicializado"
else
    log_info "Repositorio Git ya existe"
fi

# Configurar .gitignore si no existe
if [ ! -f ".gitignore" ]; then
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
*/node_modules/

# Build outputs
dist/
build/
.next/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite

# Logs
logs/
*.log
npm-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Docker volumes
postgres_data/
redis_data/

# Backup files
*.sql.gz
backup/
EOF
    log_info ".gitignore creado"
fi

echo ""
log_step "3. Verificando package.json del backend..."

cd backend

# Verificar que Prisma está configurado
if ! grep -q "prisma" package.json; then
    log_warn "Prisma no encontrado en package.json del backend"
fi

# Verificar scripts esenciales
for script in "build" "start:prod" "prisma:generate" "prisma:migrate"; do
    if grep -q "\"$script\"" package.json; then
        log_info "✅ Script '$script' encontrado"
    else
        log_warn "⚠️  Script '$script' NO encontrado en package.json"
    fi
done

cd ..

echo ""
log_step "4. Verificando configuración de producción..."

# Verificar que main.ts tiene host 0.0.0.0
if grep -q "0.0.0.0" backend/src/main.ts; then
    log_info "✅ Backend configurado para escuchar en 0.0.0.0"
else
    log_warn "⚠️  El backend podría no escuchar en todas las interfaces"
fi

# Verificar health endpoint
if [ -f "backend/src/health/health.controller.ts" ]; then
    log_info "✅ Health endpoint configurado"
else
    log_warn "⚠️  Health endpoint NO encontrado"
fi

echo ""
log_step "5. Resumen de archivos generados..."

echo ""
echo "📁 ESTRUCTURA DEL PROYECTO:"
find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.next/*' -not -path './backend/node_modules/*' -not -path './frontend/node_modules/*' | sort | wc -l | xargs echo "   Total archivos:"

echo ""
echo "📦 MÓDULOS DEL BACKEND:"
ls -1 backend/src/*/ 2>/dev/null | grep "/$" | sed 's/backend\/src\//   /' | sed 's/\/$//'

echo ""
echo "🎨 PÁGINAS DEL FRONTEND:"
ls -1 frontend/src/app/*/ 2>/dev/null | grep "/$" | sed 's/frontend\/src\/app\//   /' | sed 's/\/$//'

echo ""
echo "=========================================="
echo "  ✅ PROYECTO LISTO PARA DESPLEGAR"
echo "=========================================="
echo ""
echo "PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  Sube el código a GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for deploy'"
echo "   git push origin main"
echo ""
echo "2️⃣  Sigue la guía DEPLOY.md:"
echo "   📄 DEPLOY.md"
echo ""
echo "3️⃣  Servicios necesarios (gratis):"
echo "   🌐 Vercel     → https://vercel.com"
echo "   ⚙️  Render     → https://render.com"
echo "   🗄️  Neon       → https://neon.tech"
echo "   ⚡ Upstash    → https://upstash.com"
echo ""
echo "⏱️  Tiempo estimado: 10-15 minutos"
echo "💰 Costo: $0 / mes"
echo ""
