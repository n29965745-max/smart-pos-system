#!/bin/bash

# ============================================================================
# SMART POS SYSTEM - AUTOMATED BACKUP SCRIPT
# ============================================================================
# This script creates automated backups of the Supabase PostgreSQL database
# Usage: ./scripts/backup.sh
# Cron: 0 2 * * * /path/to/backup.sh (runs daily at 2 AM)
# ============================================================================

set -e  # Exit on error

# ============================================================================
# CONFIGURATION
# ============================================================================
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="smart_pos_backup_${DATE}.sql"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# VALIDATION
# ============================================================================
log "Starting backup process..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check disk space (require at least 1GB free)
AVAILABLE_SPACE=$(df -BG "$BACKUP_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 1 ]; then
    log_error "Insufficient disk space. Available: ${AVAILABLE_SPACE}GB, Required: 1GB"
    exit 1
fi

log "Backup directory: $BACKUP_DIR"
log "Retention period: $RETENTION_DAYS days"
log "Available disk space: ${AVAILABLE_SPACE}GB"

# ============================================================================
# BACKUP EXECUTION
# ============================================================================
log "Creating database backup..."

# Perform backup using pg_dump
if pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/${BACKUP_FILE}" 2>> "$LOG_FILE"; then
    log_success "Database backup created: ${BACKUP_FILE}"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    log "Backup size: ${BACKUP_SIZE}"
else
    log_error "Database backup failed"
    exit 1
fi

# ============================================================================
# COMPRESSION
# ============================================================================
log "Compressing backup..."

if gzip "${BACKUP_DIR}/${BACKUP_FILE}"; then
    log_success "Backup compressed: ${BACKUP_FILE}.gz"
    
    # Get compressed file size
    COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}.gz" | cut -f1)
    log "Compressed size: ${COMPRESSED_SIZE}"
else
    log_error "Backup compression failed"
    exit 1
fi

# ============================================================================
# VERIFICATION
# ============================================================================
log "Verifying backup integrity..."

if gunzip -t "${BACKUP_DIR}/${BACKUP_FILE}.gz" 2>> "$LOG_FILE"; then
    log_success "Backup integrity verified"
else
    log_error "Backup integrity check failed"
    exit 1
fi

# ============================================================================
# CLEANUP OLD BACKUPS
# ============================================================================
log "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."

DELETED_COUNT=$(find "$BACKUP_DIR" -name "smart_pos_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log_success "Deleted ${DELETED_COUNT} old backup(s)"
else
    log "No old backups to delete"
fi

# ============================================================================
# BACKUP SUMMARY
# ============================================================================
TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "smart_pos_backup_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log_success "Backup completed successfully!"
log "Total backups: ${TOTAL_BACKUPS}"
log "Total backup size: ${TOTAL_SIZE}"

# ============================================================================
# OPTIONAL: UPLOAD TO CLOUD STORAGE
# ============================================================================
# Uncomment and configure for cloud backup (Cloudflare R2, AWS S3, etc.)

# if [ -n "$CLOUDFLARE_R2_BUCKET" ]; then
#     log "Uploading to Cloudflare R2..."
#     aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
#         "s3://${CLOUDFLARE_R2_BUCKET}/backups/${BACKUP_FILE}.gz" \
#         --endpoint-url "$CLOUDFLARE_R2_ENDPOINT"
#     
#     if [ $? -eq 0 ]; then
#         log_success "Backup uploaded to cloud storage"
#     else
#         log_error "Cloud upload failed"
#     fi
# fi

# ============================================================================
# MONITORING INTEGRATION
# ============================================================================
# Send success notification to monitoring service
if [ -n "$HEALTHCHECK_URL" ]; then
    curl -fsS --retry 3 "$HEALTHCHECK_URL" > /dev/null 2>&1 || log_warning "Health check ping failed"
fi

log "Backup process completed at $(date)"
echo "---" >> "$LOG_FILE"

exit 0
