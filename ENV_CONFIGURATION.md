# Environment Configuration Guide

## 📋 Overview
This project uses a **single source of truth** for environment variables: `.env.local`

## 🔑 Environment Variable Strategy

### Single Source of Truth: `.env.local`
- ✅ **Use `.env.local`** for all local development
- ✅ Contains sensitive API keys (gitignored)
- ✅ Override any default values here
- ❌ **Never commit** `.env.local` to git

### Variable Naming Convention
We use `VITE_` prefix for all frontend environment variables:

```bash
VITE_GEMINI_API_KEY=your-api-key-here
```

**Why `VITE_` prefix?**
- Vite automatically exposes variables with `VITE_` prefix to the browser
- Provides security by preventing accidental exposure of sensitive server-side variables
- Standard Vite convention for client-side variables

## 🚀 Setup Instructions

### 1. Initial Setup
```bash
# Copy the example file to create your local environment
cp .env.example .env.local

# Edit .env.local and add your actual API keys
# DO NOT edit .env.example - it's a template
```

### 2. Configure API Key
Edit `.env.local` and add your Gemini API key:

```bash
# Get your API key from: https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=AIzaSy...your-actual-key-here

# RAG Backend URL (default for local development)
NEXT_PUBLIC_RAG_URL=http://localhost:8000/rag
```

### 3. Verify Configuration
```bash
# Start the development server
npm run dev

# The app will throw an error if VITE_GEMINI_API_KEY is missing
# Check the console for any environment variable errors
```

## 📁 File Structure

```
.
├── .env.example          # Template file (committed to git)
├── .env.local           # Your local config (gitignored, DO NOT COMMIT)
├── .gitignore           # Ensures .env.local is never committed
└── vite.config.ts       # Vite loads env vars automatically
```

## 🔐 Security Best Practices

### ✅ DO:
- Store API keys in `.env.local`
- Use `VITE_` prefix for frontend variables
- Keep `.env.example` updated with variable names (but NOT values)
- Add `.env.local` to `.gitignore`

### ❌ DON'T:
- Commit `.env.local` to git
- Share API keys in code or documentation
- Use different variable names in different files
- Store production keys in `.env.local`

## 🔄 How It Works

### Frontend (React/Vite)
```typescript
// App.tsx
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('Missing VITE_GEMINI_API_KEY in .env.local');
}
```

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  // Vite automatically loads .env.local
  // Variables with VITE_ prefix are exposed to the browser
  const env = loadEnv(mode, '.', '');
  // ...
});
```

### Environment Variable Priority (Vite)
Vite loads environment variables in this order (highest to lowest priority):
1. `.env.[mode].local` (e.g., `.env.development.local`)
2. `.env.local` ← **We use this**
3. `.env.[mode]` (e.g., `.env.development`)
4. `.env`

## 🐛 Troubleshooting

### Problem: "Missing VITE_GEMINI_API_KEY" error
**Solution:**
1. Check if `.env.local` exists
2. Verify `VITE_GEMINI_API_KEY` is set in `.env.local`
3. Restart the dev server (`npm run dev`)

### Problem: API key not working after change
**Solution:**
1. Stop the dev server (Ctrl+C)
2. Restart with `npm run dev`
3. Vite needs restart to pick up env variable changes

### Problem: Multiple .env files causing confusion
**Solution:**
1. Delete all `.env` files except `.env.local` and `.env.example`
2. Keep only:
   - `.env.example` (template, committed)
   - `.env.local` (your config, gitignored)

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Gemini API Key](https://aistudio.google.com/app/apikey)
- [Environment Variables Best Practices](https://12factor.net/config)

## 🔄 Migration from Old Setup

If you have old `.env` files, migrate like this:

```bash
# 1. Copy your API key from old .env
cat .env

# 2. Delete old .env file
rm .env

# 3. Add the API key to .env.local with VITE_ prefix
echo "VITE_GEMINI_API_KEY=your-key-here" >> .env.local

# 4. Restart dev server
npm run dev
```

---

**Last Updated:** October 22, 2025
**Status:** ✅ Active Configuration
