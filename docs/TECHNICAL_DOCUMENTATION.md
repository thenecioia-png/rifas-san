# 🏦 Rifas & SAN Platform - Technical Documentation

## 📋 Overview

Enterprise-grade fintech platform for managing online raffles and rotating savings groups (SAN - Sistema de Ahorro rotativo).

## 🏗️ Architecture

### High-Level Design
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js       │────▶│   NGINX         │────▶│   NestJS        │
│   Frontend      │     │   Reverse Proxy │     │   Backend       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                           │
                              ▼                           ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   SSL/TLS       │     │   PostgreSQL    │
                        │   Rate Limiting │     │   Database      │
                        └─────────────────┘     └─────────────────┘
                                                        │
                              ┌─────────────────┐      │
                              │   Redis         │◀─────┘
                              │   Cache/Lock    │
                              └─────────────────┘
```

## 🔐 Security Architecture

### Authentication Flow
1. User provides credentials
2. Argon2id password verification
3. JWT access token (15 min) + Refresh token (7 days)
4. Tokens stored in HTTP-only cookies
5. Rate limiting on auth endpoints

### Authorization
- RBAC with 4 roles: SUPER_ADMIN, ADMIN, MODERATOR, USER
- Guards at controller level
- Decorator-based role checking

### Data Protection
- SQL injection prevention via Prisma ORM
- XSS protection via Helmet headers
- CSRF protection
- Input validation with class-validator
- Sensitive data redaction in audit logs

## 💾 Database Design

### Key Tables
- `users` - User accounts with role-based access
- `raffles` - Raffle definitions
- `tickets` - Individual ticket numbers with status
- `san_groups` - Savings group definitions
- `san_members` - Group memberships with turn order
- `payments` - Payment records with audit trail
- `audit_logs` - Immutable audit trail

### Critical Constraints
- Unique constraints on ticket numbers per raffle
- Foreign key relationships with cascading deletes
- Check constraints on financial amounts
- Indexes on frequently queried columns

## 🔄 Raffle Ticket Flow

```
User selects tickets
        │
        ▼
System acquires Redis lock
        │
        ▼
Transaction with SERIALIZABLE isolation
        │
        ▼
Tickets marked RESERVED (10 min timeout)
        │
        ▼
User completes payment
        │
        ▼
Webhook confirms payment
        │
        ▼
Tickets marked SOLD
        │
        ▼
Real-time notification via WebSocket
```

## 💰 Payment Processing

### Supported Providers
- Stripe
- MercadoPago
- PayPal
- Bank Transfer (manual)
- Wallet (internal)

### Idempotency
- Redis-based deduplication
- Provider reference tracking
- Webhook signature verification
- Duplicate webhook prevention

## 📊 SAN (Savings Group) Flow

```
Admin creates SAN group
        │
        ▼
Users join (up to max members)
        │
        ▼
Group activates when full
        │
        ▼
Payment schedule generated
        │
        ▼
Members pay contributions
        │
        ▼
Recipient receives lump sum
        │
        ▼
Process repeats for each round
```

## 🚀 Deployment

### Docker Compose
```bash
cp .env.example .env
# Edit .env with your values
docker-compose up -d
```

### Backup Strategy
- Automated daily backups at 2 AM
- 30-day retention policy
- Optional S3 upload
- SHA-256 checksums for integrity

## 📈 Monitoring

### Key Metrics
- Active users
- Revenue per day
- Ticket sales velocity
- SAN group completion rate
- Failed payment rate

### Alerts
- Failed login attempts > 5
- Payment failures > threshold
- System errors
- Database connection issues

## 🛠️ Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Redis 7

### Local Setup
```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

Swagger UI available at: `http://localhost:3001/api/v1/docs`

## 🔒 Security Checklist

- [ ] HTTPS enforced in production
- [ ] JWT secrets rotated regularly
- [ ] Database backups encrypted
- [ ] Rate limiting enabled
- [ ] Audit logs retained indefinitely
- [ ] No sensitive data in logs
- [ ] CSRF tokens validated
- [ ] Input sanitized
- [ ] SQL injection prevented
- [ ] XSS headers configured

## 🆘 Emergency Procedures

### Database Recovery
1. Stop application containers
2. Restore from latest backup
3. Verify data integrity
4. Restart services

### Security Incident
1. Revoke all sessions
2. Force password resets
3. Review audit logs
4. Notify affected users
5. Document incident

## 📞 Support

For technical support contact: devops@rifas-san.com
