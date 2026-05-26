# ============================================
# RIFAS & SAN - MAKEFILE
# ============================================

.PHONY: help install dev build docker-up docker-down db-migrate db-seed db-reset backup lint test clean

help:
	@echo "Rifas & SAN - Available commands:"
	@echo "  make install      - Install dependencies for both frontend and backend"
	@echo "  make dev          - Start development servers"
	@echo "  make build        - Build production images"
	@echo "  make docker-up    - Start all services with Docker Compose"
	@echo "  make docker-down  - Stop all services"
	@echo "  make db-migrate   - Run database migrations"
	@echo "  make db-seed      - Seed database with initial data"
	@echo "  make db-reset     - Reset database (WARNING: destructive)"
	@echo "  make backup       - Create database backup"
	@echo "  make lint         - Run linters"
	@echo "  make test         - Run tests"
	@echo "  make clean        - Clean build artifacts"

install:
	cd backend && npm install
	cd frontend && npm install

dev:
	@echo "Starting development servers..."
	cd backend && npm run start:dev &
	cd frontend && npm run dev

build:
	cd backend && npm run build
	cd frontend && npm run build

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

docker-logs:
	docker-compose logs -f

db-migrate:
	cd backend && npx prisma migrate dev

db-deploy:
	cd backend && npx prisma migrate deploy

db-generate:
	cd backend && npx prisma generate

db-studio:
	cd backend && npx prisma studio

db-seed:
	cd backend && npx prisma db seed

db-reset:
	cd backend && npx prisma migrate reset --force

backup:
	bash scripts/backup.sh

lint:
	cd backend && npm run lint
	cd frontend && npm run lint

test:
	cd backend && npm test
	cd frontend && npm test

clean:
	cd backend && rm -rf dist node_modules
	cd frontend && rm -rf .next node_modules
