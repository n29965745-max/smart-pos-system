#!/bin/bash

# ============================================================================
# SMART POS SYSTEM - DATABASE RESTORE SCRIPT
# ============================================================================
# This script restores a database backup
# Usage: ./scripts/restore.sh <backup_file>
# Example: ./scripts/restore.sh /backups/smart_pos_backup_20260526_020000.sql.gz
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

# ============================================================================
# VALIDATION
# ============================================================================
if [ $# -eq 0 ]; then
    log_error "Usage: $0 <backup_file>"
    log "Example: $0 /backups/smart_pos_backup_20260526_020000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
fi

# ============================================================================
# SAFETY CONFIRMATION
# ============================================================================
log_warning "⚠️  WARNING: This will OVERWRITE the current database!"
log "Backup file: $BACKUP_FILE"
log "Database: $DATABASE_URL"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log "Restore cancelled by user"
    exit 0
fi

# ============================================================================
# PRE-RESTORE BACKUP
# ============================================================================
log "Creating pre-restore backup of current database..."
PRE_RESTORE_BACKUP="/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

if pg_dump "$DATABASE_URL" | gzip > "$PRE_RESTORE_BACKUP"; then
    log_success "Pre-restore backup created: $PRE_RESTORE_BACKUP"
else
    log_error "Failed to create pre-restore backup"
    exit 1
fi

# ============================================================================
# RESTORE EXECUTION
# ============================================================================
log "Starting database restore..."

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    log "Decompressing backup file..."
    TEMP_SQL="/tmp/restore_temp_$(date +%Y%m%d_%H%M%S).sql"
    
    if gunzip -c "$BACKUP_FILE" > "$TEMP_SQL"; then
        log_success "Backup decompressed"
        RESTORE_FILE="$TEMP_SQL"
    else
        log_error "Failed to decompress backup"
        exit 1
    fi
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# Perform restore
log "Restoring database from backup..."
START_TIME=$(date +%s)

if psql "$DATABASE_URL" < "$RESTORE_FILE" 2>&1 | tee /tmp/restore.log; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    log_success "Database restored successfully in ${DURATION} seconds"
else
    log_error "Database restore failed. Check /tmp/restore.log for details"
    log_warning "Pre-restore backup available at: $PRE_RESTORE_BACKUP"
    exit 1
fi

# ============================================================================
# CLEANUP
# ============================================================================
if [ -f "$TEMP_SQL" ]; then
    rm "$TEMP_SQL"
    log "Temporary files cleaned up"
fi

# ============================================================================
# VERIFICATION
# ============================================================================
log "Verifying database connectivity..."

if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
    log_success "Database is accessible and responding"
else
    log_error "Database verification failed"
    exit 1
fi

# ============================================================================
# SUMMARY
# ============================================================================
log_success "Restore completed successfully!"
log "Restored from: $BACKUP_FILE"
log "Pre-restore backup: $PRE_RESTORE_BACKUP"
log "Restore log: /tmp/restore.log"
log ""
log_warning "Remember to:"
log "1. Verify application functionality"
log "2. Check data integrity"
log "3. Monitor for any issues"
log "4. Keep pre-restore backup until verified"

exit 0
