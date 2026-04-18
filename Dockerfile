# STAGE 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy source and generate Prisma
COPY . .
RUN npx prisma generate

# Compile the seed script for production
RUN npx tsc prisma/seed.ts --esModuleInterop --module CommonJS --skipLibCheck

RUN npm run build

# STAGE 2: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security: Set up non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions on the /app folder
RUN chown -R nextjs:nodejs /app

# Copy needed files from builder - WITH CORRECT OWNERSHIP
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Grant execution rights to the startup script
RUN chmod +x ./scripts/start.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use the automated startup script
CMD ["./scripts/start.sh"]
