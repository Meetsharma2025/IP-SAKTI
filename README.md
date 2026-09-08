# IP-SAKTI Sahayak

**Multilingual, RAG-based AI assistant for Intellectual Property and regulatory guidance in Ayurveda**

Built for SIH Problem Statement #26045 — Ministry of AYUSH / All India Institute of Ayurveda

## 🚀 Deploy to Vercel

### Step 1: Get a PostgreSQL database (free)
Go to [neon.tech](https://neon.tech) → Create project → Copy the connection string

### Step 2: Get an AI API key
Go to [build.nvidia.com](https://build.nvidia.com) → Get API key for Nemotron 3 Ultra

### Step 3: Deploy
1. Push this code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Add these **Environment Variables** before deploying:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon connection string (with `?sslmode=require`) |
| `NVIDIA_API_KEY` | Your NVIDIA Build API key (`nvapi-...`) |
| `OPENROUTER_API_KEY` | *(optional fallback)* OpenRouter key |

4. Click **Deploy**
5. After deploy, visit `https://your-app.vercel.app` — the app auto-creates all database tables and seeds the knowledge base on first load

### That's it! ✅

---

## 🏗️ Architecture

```
User → Query Analyzer → Hybrid Search (Vector + Keyword + Graph)
  → NVIDIA Nemotron 3 Ultra (reasoning enabled)
    → Evidence-based Confidence (6-component scoring)
      → Safe Abstention or Source-Cited Answer
```

## 📊 Platform Stats
- 25 routes (10 pages + 15 API endpoints)
- 16 database tables (knowledge graph + multi-tenant workspaces)
- 49 knowledge documents with 200-dim embeddings
- 6 languages (EN, HI, TA, TE, BN, MR) + voice I/O
- 6 export market pathways

## 🔧 Local Development

```bash
npm install
cp .env.example .env   # Fill in your keys
npm run dev
# Visit http://localhost:3000
```
