# Lovable.dev Project Setup Checklist

**Purpose**: Step-by-step guide to download your Lovable app and configure Claude Code for continued development

---

## Step 1: Export from Lovable

### Option A: Connect to GitHub (Recommended)
1. Open your project in Lovable.dev
2. Go to **Settings** (gear icon)
3. Click **Integrations**
4. Click **Connect to GitHub**
5. Select or create a repository
6. Lovable will push your project automatically
7. Note the repository URL

### Option B: Download ZIP
1. Open your project in Lovable.dev
2. Click **Export** or **Download**
3. Download the ZIP file
4. Create a new GitHub repo manually
5. Push the code to GitHub

---

## Step 2: Clone Repository Locally

```bash
# Clone from GitHub
git clone https://github.com/YOUR-ORG/YOUR-LOVABLE-APP.git
cd YOUR-LOVABLE-APP

# Install dependencies
npm install
```

---

## Step 3: Move Configuration Files

The Context folder and CLAUDE.md are already created. Copy them to your cloned project:

```bash
# From the Grouphome App LOVABLE folder, copy:
cp -r Context/ /path/to/your/cloned/project/
cp CLAUDE.md /path/to/your/cloned/project/
cp SETUP-CHECKLIST.md /path/to/your/cloned/project/
```

Your project structure should look like:
```
your-lovable-app/
├── index.html
├── src/
├── public/
├── Context/
│   ├── LOVABLE-STANDARDS.md
│   └── AGENT-LOVABLE-DEVELOPER.md
├── CLAUDE.md
├── SETUP-CHECKLIST.md
├── package.json
├── vite.config.ts
├── tsconfig.json
└── ...
```

---

## Step 4: Configure Environment Variables

### Create `.env.local`:
```bash
# In your project root
touch .env.local
```

### Add Supabase Configuration:
```bash
# .env.local
VITE_SUPABASE_URL=https://hpyodaugrkctagkrfofj.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

### Important Notes:
- **NEVER commit `.env.local`** (it should be in `.gitignore`)
- Anon key is safe for client-side use
- Service role key is for MCP/backend only

---

## Step 5: Verify Project Structure

### Required Files (Must Exist):
- [ ] `index.html` at project root
- [ ] `src/main.tsx` - App bootstrap
- [ ] `src/App.tsx` - Root component
- [ ] `src/index.css` - Tailwind directives
- [ ] `vite.config.ts` - Vite configuration
- [ ] `tsconfig.json` - TypeScript config
- [ ] `tailwind.config.js` - Tailwind config
- [ ] `components.json` - ShadCN config
- [ ] `package.json` - Dependencies

### Required Folders (Must Exist):
- [ ] `src/components/` - React components
- [ ] `src/components/ui/` - ShadCN components
- [ ] `src/lib/` - Library configs (supabase client)
- [ ] `public/` - Static assets

### Create If Missing:
```bash
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/pages
mkdir -p src/contexts
mkdir -p src/utils
```

---

## Step 6: Verify TypeScript Configuration

### Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,  // MUST be true
    "paths": {
      "@/*": ["./src/*"]  // Path alias for imports
    }
  }
}
```

### Test TypeScript:
```bash
npx tsc --noEmit
```

Should complete with no errors.

---

## Step 7: Verify Vite Configuration

### Check `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Step 8: Test Local Development Server

```bash
# Start the dev server
npm run dev
```

Should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

Open `http://localhost:5173` in browser to verify app loads.

---

## Step 9: Verify Supabase Connection

### Check `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Test Connection:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Look for requests to `hpyodaugrkctagkrfofj.supabase.co`
5. Should see 200 OK responses

---

## Step 10: Configure MCP Servers

### Supabase MCP (Already Available)
The service role key is already in your CLAUDE.md:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Claude Code can use this to:
- Query database directly
- Inspect schema
- Verify RLS policies
- Check table structures

### Other MCPs (Already Configured):
- **Playwright** - Visual validation
- **Context7** - Latest documentation
- **N8n** - Workflow automation

---

## Step 11: Git Configuration

### Verify `.gitignore`:
```bash
# Should include:
node_modules/
dist/
.env.local
.env.*.local
*.local
```

### Initial Commit:
```bash
git add Context/ CLAUDE.md SETUP-CHECKLIST.md
git commit -m "chore: Add Claude Code agent configuration for Lovable development"
```

**DO NOT PUSH YET** - Wait for explicit approval!

---

## Step 12: Test Agent Configuration

### Verify Agent Access:
1. Claude Code should automatically read CLAUDE.md
2. Agent will reference `/Context/LOVABLE-STANDARDS.md` for code patterns
3. Agent will follow `/Context/AGENT-LOVABLE-DEVELOPER.md` for workflow

### Test Commands:
1. Ask Claude to "check the project structure"
2. Ask Claude to "verify TypeScript compilation"
3. Ask Claude to "take a screenshot of the app"

---

## Step 13: Development Workflow Test

### Create a Test Task:
1. Ask Claude to make a small UI change
2. Verify Claude:
   - Reads LOVABLE-STANDARDS.md
   - Uses ShadCN components
   - Uses Tailwind classes
   - Takes screenshots after
   - Checks TypeScript compilation
   - Commits locally
   - **Asks for approval before pushing**

---

## Verification Complete!

### You're Ready When:
- [ ] Project cloned and npm installed
- [ ] Context folder with agent files in place
- [ ] CLAUDE.md in project root
- [ ] `.env.local` configured with Supabase keys
- [ ] Dev server runs without errors
- [ ] TypeScript compilation passes
- [ ] App loads in browser
- [ ] Claude Code can access the project
- [ ] Agent follows Lovable standards automatically

---

## Troubleshooting

### Common Issues:

**TypeScript Errors**:
```bash
npx tsc --noEmit
# Fix any type errors before proceeding
```

**Vite Build Errors**:
```bash
npm run build
# Check for import issues or missing dependencies
```

**Supabase Connection Fails**:
- Check `.env.local` has correct keys
- Verify keys are prefixed with `VITE_`
- Restart dev server after changing env vars

**ShadCN Components Missing**:
```bash
npx shadcn@latest add [component-name]
```

**Import Path Issues**:
- Ensure tsconfig.json has `"@/*": ["./src/*"]`
- Ensure vite.config.ts has matching alias

---

## Ready to Develop!

Once all checks pass:
1. Start your dev server: `npm run dev`
2. Open Claude Code in this project directory
3. Start building - Claude will follow Lovable standards automatically
4. Remember: All GitHub pushes require your explicit approval

**Happy coding with Lovable compatibility!**
