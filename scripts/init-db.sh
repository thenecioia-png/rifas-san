#!/bin/bash
# ============================================
# DATABASE INITIALIZATION SCRIPT
# ============================================

set -e

echo "🚀 Initializing database..."

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h localhost -U rifas_admin; do
  sleep 1
done

echo "✅ PostgreSQL is ready"

# Run Prisma migrations
cd ../backend

echo "📦 Installing dependencies..."
npm install

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database (optional)..."
# npx prisma db seed

echo "✅ Database initialization complete!"
