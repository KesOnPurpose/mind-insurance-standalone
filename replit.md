# Grouphomes4newbies

A multi-agent AI platform for group home training featuring three specialized AI coaches (Nette, MIO, ME), RAG-powered knowledge retrieval, and a comprehensive PROTECT practice system.

## Quick Reference

- **Full Documentation**: See `docs/APP-STRUCTURE.md` for complete page-by-page breakdown with data flows
- **Architecture**: Serverless (React + Supabase Edge Functions)
- **Database**: Supabase PostgreSQL (external)

## Key Features

| Feature | Route | Status |
|---------|-------|--------|
| Landing Page | `/` | Working |
| Authentication | `/auth` | Working |
| Assessment | `/assessment` | Working |
| Dashboard | `/dashboard` | Working |
| Roadmap (403 tactics) | `/roadmap` | Working |
| AI Chat (3 agents) | `/chat` | Working |
| PROTECT Practices | `/protect` | Working |
| Mind Insurance Hub | `/mind-insurance` | Working |
| Admin Dashboard | `/admin` | Working |

## Known Issue

**New User Signup Blocked**: The `handle_new_user()` database trigger tries to insert into columns that don't exist in `user_profiles`. Run the SQL fix in Supabase SQL Editor to add missing columns.

## The Three AI Agents

1. **Nette** - Group Home Expert (tactics, licensing, roadmaps)
2. **MIO** - Mind Insurance Oracle (mindset, accountability, PROTECT)
3. **ME** - Money Evolution Expert (financing, funding, ROI)

## Tech Stack

- Frontend: React 18, Vite, TypeScript, TailwindCSS, Shadcn UI
- Backend: Supabase Edge Functions (Deno)
- Database: Supabase PostgreSQL
- AI: OpenAI API (embeddings + completions)
- Auth: Supabase Auth (email, Google OAuth, magic link)

## Running the App

```bash
npm run dev
```

The app runs on port 5000 with Vite dev server.
