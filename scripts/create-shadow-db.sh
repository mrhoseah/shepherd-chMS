#!/bin/bash
# Script to create a shadow database for Prisma migrations
# Run this as a PostgreSQL superuser (e.g., postgres user)

echo "Creating shadow database for Prisma migrations..."

# Read DATABASE_URL from .env file
if [ -f .env ]; then
  export $(cat .env | grep DATABASE_URL | sed 's/#.*//g' | xargs)
fi

# Extract database name from DATABASE_URL
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
SHADOW_DB_NAME="${DB_NAME}_shadow"

echo "Main database: $DB_NAME"
echo "Shadow database: $SHADOW_DB_NAME"

# Create shadow database (requires superuser)
psql -U postgres -c "CREATE DATABASE ${SHADOW_DB_NAME};" 2>/dev/null || echo "Database might already exist or permission denied"

# Grant permissions to dev user
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${SHADOW_DB_NAME} TO dev;" 2>/dev/null || echo "Could not grant permissions"

echo "Shadow database created: ${SHADOW_DB_NAME}"
echo ""
echo "Add this to your .env file:"
echo "SHADOW_DATABASE_URL=\"postgresql://dev:5210@localhost:5432/${SHADOW_DB_NAME}?schema=public\""

