#!/bin/bash

# Script to run database migrations
# Usage: ./run_migrations.sh [database_name] [user] [host]

DB_NAME=${1:-bounty_hunter}
DB_USER=${2:-postgres}
DB_HOST=${3:-localhost}

echo "Running database migrations..."
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Host: $DB_HOST"
echo ""

# Run init script first
echo "Running initialization script..."
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f packages/database/scripts/init.sql

if [ $? -ne 0 ]; then
  echo "Error: Failed to run initialization script"
  exit 1
fi

echo "Initialization complete."
echo ""

# Run migrations in order
echo "Running migrations..."
for migration in packages/database/migrations/*.sql; do
  echo "Applying migration: $(basename $migration)"
  psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $migration
  
  if [ $? -ne 0 ]; then
    echo "Error: Failed to apply migration $(basename $migration)"
    exit 1
  fi
done

echo ""
echo "All migrations completed successfully!"
