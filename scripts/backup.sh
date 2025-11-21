#!/bin/bash

# Database Backup Script
set -e

# Load environment variables
set -a
source .env.production 2>/dev/null || source .env
set +a

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

echo "🗄️  Starting database backup..."

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Run backup
echo "Creating backup: ${BACKUP_FILE}"
docker-compose -f docker-compose.prod.yml exec -T postgres \
    pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > ${BACKUP_FILE}

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h ${BACKUP_FILE} | cut -f1)
    echo "✅ Backup completed successfully (Size: ${BACKUP_SIZE})"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Upload to S3 (if configured)
if [ ! -z "$AWS_S3_BACKUP_BUCKET" ]; then
    echo "📤 Uploading backup to S3..."
    aws s3 cp ${BACKUP_FILE} s3://${AWS_S3_BACKUP_BUCKET}/backups/$(basename ${BACKUP_FILE})
    echo "✅ Backup uploaded to S3"
fi

# Clean up old backups
echo "🧹 Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find ${BACKUP_DIR} -name "backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List recent backups
echo ""
echo "📋 Recent backups:"
ls -lh ${BACKUP_DIR}/backup_*.sql.gz 2>/dev/null | tail -5 || echo "No backups found"

echo ""
echo "✅ Backup process completed!"
