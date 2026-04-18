# 🚀 SevaSetu: Production Deployment Guide

This guide covers how to deploy the **SevaSetu** platform to professional cloud environments using a "Hybrid-Cloud" approach.

---

## 💎 1. Database: Neon (Serverless PostgreSQL)

Neon is the recommended database for production due to its high-speed branching and serverless pooling.

### Setup Instructions
1. Create a project at [Neon.tech](https://neon.tech).
2. Go to the **Connection Details** section.
3. **Important**: You need TWO connection strings for Prisma:
   - **DATABASE_URL**: Use the **Pooled** connection string (it ends with some suffix like `-pooler`). This allows hundreds of serverless functions to share the same DB connections.
   - **DIRECT_URL**: Use the **Non-pooled** connection string. This is used by Prisma for schema migrations (migrations cannot run through a pooler).

### Environment Variables
```env
DATABASE_URL="postgres://user:password@subdomain-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgres://user:password@subdomain.region.aws.neon.tech/neondb?sslmode=require"
```

---

## ⚡ 2. Frontend & API: Vercel (Serverless)

Vercel is the easiest way to deploy Next.js 15 apps with automatic global scaling.

### Setup Instructions
1. Push your code to GitHub.
2. Import the repository into [Vercel](https://vercel.com).
3. Add the following **Environment Variables** in the Vercel dashboard:
   - `DATABASE_URL` (from Neon Pooler)
   - `DIRECT_URL` (from Neon Direct)
   - `JWT_SECRET` (A strong random string)
   - `GROQ_API_KEY` (Your AI key)
4. Set the **Framework Preset** to `Next.js`.
5. Deploy.

---

## 🐳 3. Urban Scale Cluster: Docker & Nginx (VPS/K8s)

For urban-scale deployments where you need constant background tasks and guaranteed concurrency, use the containerized setup we built.

### Single VPS Setup (Docker Compose)
1. Point your domain A-record to your VPS IP.
2. Clone the repo on your VPS.
3. Run the "One-Command" setup:
   ```bash
   docker-compose up -d --build --scale app=5
   ```
   *Note: This starts 5 instances of the app behind an Nginx Load Balancer.*

### Kubernetes Setup
1. Use the manifests in `/k8s`.
2. Apply them to your cluster:
   ```bash
   kubectl apply -f k8s/
   ```
3. This will enable **Horizontal Pod Autoscaling (HPA)**, meaning the cluster will grow or shrink automatically based on the city's traffic.

---

## 🧪 4. Performance Verification
After deployment, verify the production performance:
```bash
# Run the load test against your production domain
API_URL="https://yourdomain.com/api/grievances" npx tsx scripts/load-test.ts
```
