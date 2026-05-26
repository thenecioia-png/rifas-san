#!/bin/bash
# ============================================
# BACKUP SCRIPT FOR RIFAS-SAN PLATFORM
# ============================================

set -e

# Configuration
BACKUP_DIR="/backup"
DB_NAME="${DB_NAME:-rifas_san_db}"
DB_USER="${DB_USER:-rifas_admin}"
DB_PASSWORD="${DB_PASSWORD:-SecureP@ssw0rd2024!}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/rifas_san_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

log_info "Starting backup process..."

# Perform PostgreSQL backup
log_info "Dumping database: $DB_NAME"
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h localhost \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    --verbose \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    > "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    log_error "Database dump failed"
    exit 1
fi

# Calculate checksum
checksum=$(sha256sum "$BACKUP_FILE" | awk '{ print $1 }')

# Compress backup
log_info "Compressing backup..."
gzip -f "$BACKUP_FILE"

# Get file size
file_size=$(stat -f%z "$COMPRESSED_FILE" 2>/dev/null || stat -c%s "$COMPRESSED_FILE")

# Log backup details
cat >> "${BACKUP_DIR}/backup.log" << EOF
Backup completed at $(date)
File: $COMPRESSED_FILE
Size: $file_size bytes
Checksum: $checksum
Database: $DB_NAME
EOF

log_info "Backup completed: $COMPRESSED_FILE"
log_info "Size: $(numfmt --to=iec $file_size)"
log_info "Checksum: $checksum"

# Clean old backups
log_info "Cleaning backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "rifas_san_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "rifas_san_backup_*.sql" -mtime +$RETENTION_DAYS -delete

# Count remaining backups
remaining=$(find "$BACKUP_DIR" -name "rifas_san_backup_*.sql.gz" | wc -l)
log_info "Remaining backups: $remaining"

# Optional: Upload to S3 if configured
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$BACKUP_S3_BUCKET" ]; then
    log_info "Uploading to S3..."
    aws s3 cp "$COMPRESSED_FILE" "s3://${BACKUP_S3_BUCKET}/backups/" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log_info "S3 upload completed"
    else
        log_warn "S3 upload failed"
    fi
fi

log_info "Backup process completed successfully"
