# IP-SAKTI Sahayak

**Multilingual, RAG-based AI assistant for Intellectual Property and regulatory guidance in Ayurveda**

Built for SIH Problem Statement #26045 — Ministry of AYUSH / All India Institute of Ayurveda

## 🚀 Deploy to Vercel + Neon

### Quick Setup

```bash
# 1. Clone and install
git clone <your-repo>
cd ip-sakti-sahayak
npm install

# 2. Set up Neon database
npm i -g neon@latest
neon login
neon link --project-id withered-hall-59779382 --branch production -y
neon config init

# 3. Push database schema
npx drizzle-kit push

# 4. Deploy
neon deploy
```

### Environment Variables (set in Vercel)

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Neon dashboard → Connection string |
| `NVIDIA_API_KEY` | [build.nvidia.com](https://build.nvidia.com) |
| `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) *(fallback)* |

### After Deploy
Visit your app URL — it auto-creates all 16 database tables and seeds 49 knowledge documents on first load.

---

## 🏗️ Architecture

```
User → Query Analyzer → Hybrid Search (Vector + Keyword + Graph)
  → NVIDIA Nemotron 3 Ultra (reasoning enabled)
    → Evidence Confidence (6-component)
      → Safe Abstention or Source-Cited Answer
```

### Multi-Tenant Client Workspaces
```
Organization → Products → IP Portfolio → Documents → Compliance
  → Client-Aware RAG → Personalized IP Guidance
```

## 📊 Stats
- 25 routes (10 pages + 15 APIs)
- 16 database tables (knowledge graph + multi-tenant)
- 49 knowledge documents with 200-dim embeddings
- 6 languages + voice I/O
- 6 export market pathways
- NVIDIA Nemotron 3 Ultra + OpenRouter fallback

## 🔧 Local Dev

```bash
cp .env.example .env   # Fill in your keys
npm run dev
```
