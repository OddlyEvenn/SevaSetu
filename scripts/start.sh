# This script ensures the database is initialized before starting the application.
set -e

echo "🚀 Starting SevaSetu System Initialization..."

# 1. Sync Database Schema
echo "📋 Syncing Database Schema (Prisma)..."
npx prisma db push --accept-data-loss

echo "🌱 Seeding Database..."
npx prisma db seed

echo "✅ Database is ready."

# 2. Start the Production Server
echo "🌐 Starting Next.js Production Server..."
node server.js
